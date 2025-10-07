# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Create Account" [level=1] [ref=e6]
    - paragraph [ref=e7]: Join Field Force CRM
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]: Full Name
      - textbox "John Doe" [active] [ref=e11]
    - generic [ref=e12]:
      - generic [ref=e13]: Email Address
      - textbox "john@example.com" [ref=e14]
    - generic [ref=e15]:
      - generic [ref=e16]: Phone Number
      - textbox "9999999999 (without country code)" [ref=e17]
      - paragraph [ref=e18]: Enter 10-digit mobile number (India)
    - generic [ref=e19]:
      - generic [ref=e20]: Password
      - textbox "Min 8 characters" [ref=e21]
    - generic [ref=e22]:
      - generic [ref=e23]: Role
      - combobox [ref=e24]:
        - option "Field Representative" [selected]
        - option "Manager"
    - button "Continue to Verification" [ref=e25] [cursor=pointer]
    - paragraph [ref=e26]:
      - text: Already have an account?
      - button "Log in" [ref=e27] [cursor=pointer]
```