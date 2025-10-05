/**
 * AWS Lambda Entry Point
 *
 * Example showing how to use portable architecture on AWS Lambda
 * SAME business logic, different infrastructure!
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { createAWSDependencies, AWSEnv } from './config/dependencies';
import { VisitService } from './services/visitService';

// Initialize Prisma outside handler for connection reuse
let prisma: PrismaClient;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });
  }
  return prisma;
}

/**
 * Create Visit Lambda Handler
 */
export async function createVisitHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // 1. Get dependencies (automatically uses AWS implementations)
    const deps = createAWSDependencies(process.env as any as AWSEnv);

    // 2. Get Prisma client
    const prisma = getPrisma();

    // 3. Create service with injected dependencies
    const visitService = new VisitService(
      prisma,
      deps.storage,  // S3StorageService
      deps.queue,    // SQSQueueService
      deps.cache     // RedisCacheService
    );

    // 4. Parse request
    const body = JSON.parse(event.body || '{}');
    const userId = event.requestContext.authorizer?.userId;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // 5. Call EXACT SAME business logic as Cloudflare!
    const visit = await visitService.createVisit({
      ...body,
      userId,
    });

    // 6. Return response
    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, data: visit }),
    };
  } catch (error) {
    console.error('Create visit error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
}

/**
 * Get User Visits Lambda Handler
 */
export async function getUserVisitsHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const deps = createAWSDependencies(process.env as any as AWSEnv);
    const prisma = getPrisma();

    const visitService = new VisitService(
      prisma,
      deps.storage,
      deps.queue,
      deps.cache
    );

    const userId = event.requestContext.authorizer?.userId;
    const page = parseInt(event.queryStringParameters?.page || '1');

    // SAME business logic works on AWS!
    const visits = await visitService.getUserVisits(userId, page);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: visits }),
    };
  } catch (error) {
    console.error('Get visits error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
}

/**
 * Express.js adapter for Lambda (alternative approach)
 */
import express from 'express';
import serverless from 'serverless-http';

const expressApp = express();
expressApp.use(express.json());

expressApp.post('/api/visits', async (req, res) => {
  try {
    const deps = createAWSDependencies(process.env as any as AWSEnv);
    const prisma = getPrisma();

    const visitService = new VisitService(
      prisma,
      deps.storage,
      deps.queue,
      deps.cache
    );

    const visit = await visitService.createVisit({
      ...req.body,
      userId: (req as any).user.id,
    });

    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Export as Lambda handler
export const handler = serverless(expressApp);
