# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "E-Com" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e6]:
        - generic [ref=e8]:
          - combobox [ref=e9]:
            - option "All" [selected]
          - textbox "Search products..." [ref=e10]
          - button "🔍" [active] [ref=e11] [cursor=pointer]
        - list [ref=e12]:
          - listitem [ref=e13]:
            - link "Your Wishlist" [ref=e14] [cursor=pointer]:
              - /url: /wishlist
              - generic [ref=e15]: Your
              - generic [ref=e16]: Wishlist
          - listitem [ref=e17]:
            - link "Hello, sign in Account & Lists" [ref=e18] [cursor=pointer]:
              - /url: /login
              - generic [ref=e19]: Hello, sign in
              - generic [ref=e20]: Account & Lists
  - generic [ref=e25]:
    - heading "Register" [level=2] [ref=e26]
    - generic [ref=e27]:
      - generic [ref=e28]:
        - generic [ref=e29]: Email address
        - textbox [ref=e30]: modern_test_1766675150386@example.com
      - generic [ref=e31]:
        - generic [ref=e32]: Password
        - textbox [ref=e33]: password123
      - generic [ref=e34]:
        - generic [ref=e35]: Confirm Password
        - textbox [ref=e36]: password123
      - button "Register" [ref=e37] [cursor=pointer]
```