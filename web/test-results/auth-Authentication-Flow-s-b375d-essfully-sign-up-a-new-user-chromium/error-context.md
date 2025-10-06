# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e5]:
    - heading "Field Force CRM" [level=1] [ref=e6]
    - paragraph [ref=e7]: Create your account
  - form "Signup form" [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Full Name
        - textbox "Full Name" [ref=e12]
      - generic [ref=e13]:
        - generic [ref=e14]: Email address
        - textbox "Email address" [ref=e15]
      - generic [ref=e16]:
        - generic [ref=e17]: Phone Number (Optional)
        - textbox "Phone Number (Optional)" [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e20]: Password
        - textbox "Password" [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]: Confirm Password
        - textbox "Confirm Password" [ref=e24]
    - button "Create your account" [ref=e25] [cursor=pointer]: Sign up
    - paragraph [ref=e26]:
      - text: Already have an account?
      - link "Sign in" [ref=e27] [cursor=pointer]:
        - /url: /login
```