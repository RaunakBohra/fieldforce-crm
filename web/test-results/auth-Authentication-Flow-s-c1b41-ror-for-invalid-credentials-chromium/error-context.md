# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e5]:
    - heading "Field Force CRM" [level=1] [ref=e6]
    - paragraph [ref=e7]: Sign in to your account
  - form "Login form" [ref=e8]:
    - alert [ref=e9]: "Network error: Unable to connect to server"
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Email address
        - textbox "Email address" [ref=e13]: nonexistent@test.com
      - generic [ref=e14]:
        - generic [ref=e15]: Password
        - textbox "Password" [ref=e16]: WrongPassword123!
    - button "Sign in to your account" [ref=e17] [cursor=pointer]: Sign in
    - paragraph [ref=e18]:
      - text: Don't have an account?
      - link "Sign up" [ref=e19] [cursor=pointer]:
        - /url: /signup
```