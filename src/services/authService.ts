import { PrismaClient, User, UserRole } from '@prisma/client';
import { hash, compare } from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { SignupInput, LoginInput } from '../validators/authSchemas';

/**
 * AuthService - Business Logic Layer
 * Platform-agnostic authentication service following hexagonal architecture
 * All business logic extracted from routes for testability and reusability
 */

export interface AuthResult {
  success: boolean;
  data?: {
    user: Omit<User, 'password'>;
    token: string;
  };
  error?: string;
}

export interface UserResult {
  success: boolean;
  data?: Omit<User, 'password'>;
  error?: string;
}

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private jwtSecret: string,
    private jwtExpiresIn: string = '7d'
  ) {}

  /**
   * User signup with validation and password hashing
   * @param input Validated signup data
   * @returns Auth result with user and token
   */
  async signup(input: SignupInput): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        logger.warn('Signup attempted with existing email', { email: input.email });
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Hash password with bcrypt (cost factor: 10)
      const hashedPassword = await hash(input.password, 10);

      // Create user in database
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
          phone: input.phone || undefined,
          role: UserRole.FIELD_REP, // Default role for new signups
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          companyId: true,
        },
      });

      // Generate JWT token
      const token = await generateToken(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        this.jwtSecret,
        this.jwtExpiresIn
      );

      logger.info('User signed up successfully', { userId: user.id, email: user.email });

      return {
        success: true,
        data: {
          user,
          token,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      logger.error('Signup error', error, { email: input.email });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * User login with credential verification
   * @param input Validated login credentials
   * @returns Auth result with user and token
   */
  async login(input: LoginInput): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: input.email },
      });

      // Generic error message to prevent user enumeration
      if (!user) {
        logger.warn('Login attempted with non-existent email', { email: input.email });
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Verify password with bcrypt
      const isPasswordValid = await compare(input.password, user.password);

      if (!isPasswordValid) {
        logger.warn('Login attempted with invalid password', {
          userId: user.id,
          email: input.email,
        });
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Generate JWT token
      const token = await generateToken(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        this.jwtSecret,
        this.jwtExpiresIn
      );

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      logger.error('Login error', error, { email: input.email });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Get current user by ID
   * @param userId User ID from JWT
   * @returns User data without password
   */
  async getCurrentUser(userId: string): Promise<UserResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        logger.warn('Get current user - user not found', { userId });
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      logger.error('Get current user error', error, { userId });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Check if user has specific role
   * @param userId User ID
   * @param allowedRoles Array of allowed roles
   * @returns true if user has one of the allowed roles
   */
  async hasRole(userId: string, allowedRoles: UserRole[]): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return false;
      }

      return allowedRoles.includes(user.role);
    } catch (error: unknown) {
      logger.error('Role check error', error, { userId });
      return false;
    }
  }
}
