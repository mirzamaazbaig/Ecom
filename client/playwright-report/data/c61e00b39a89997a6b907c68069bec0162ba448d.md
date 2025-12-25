# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "E-Com Portfolio" [ref=e5] [cursor=pointer]:
        - /url: /
      - list [ref=e7]:
        - listitem [ref=e8]:
          - link "Products" [ref=e9] [cursor=pointer]:
            - /url: /
        - listitem [ref=e10]:
          - link "Login" [ref=e11] [cursor=pointer]:
            - /url: /login
        - listitem [ref=e12]:
          - link "Register" [ref=e13] [cursor=pointer]:
            - /url: /register
  - generic [ref=e18]:
    - heading "Register" [level=2] [ref=e19]
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: Email address
        - textbox [ref=e23]: testuser_1766672411195@example.com
      - generic [ref=e24]:
        - generic [ref=e25]: Password
        - textbox [ref=e26]: password123
      - generic [ref=e27]:
        - generic [ref=e28]: Confirm Password
        - textbox [active] [ref=e29]
      - button "Register" [ref=e30] [cursor=pointer]
```