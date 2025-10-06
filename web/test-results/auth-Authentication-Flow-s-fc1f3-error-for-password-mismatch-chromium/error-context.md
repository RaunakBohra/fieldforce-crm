# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e5]:
    - heading "Field Force CRM" [level=1] [ref=e6]
    - paragraph [ref=e7]: Create your account
  - form "Signup form" [ref=e8]:
    - alert [ref=e9]: Passwords do not match
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Full Name
        - textbox "Full Name" [ref=e13]: Test User
      - generic [ref=e14]:
        - generic [ref=e15]: Email address
        - textbox "Email address" [ref=e16]: mismatch@test.com
      - generic [ref=e17]:
        - generic [ref=e18]: Phone Number (Optional)
        - textbox "Phone Number (Optional)" [ref=e19]
      - generic [ref=e20]:
        - generic [ref=e21]: Password
        - textbox "Password" [ref=e22]: Test123!@#
      - generic [ref=e23]:
        - generic [ref=e24]: Confirm Password
        - textbox "Confirm Password" [ref=e25]: Different123!@#
    - button "Create your account" [active] [ref=e26] [cursor=pointer]: Sign up
    - paragraph [ref=e27]:
      - text: Already have an account?
      - link "Sign in" [ref=e28] [cursor=pointer]:
        - /url: /login
```