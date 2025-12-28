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
          - button "🔍" [ref=e11] [cursor=pointer]
        - list [ref=e12]:
          - listitem [ref=e13]:
            - link "Your Wishlist" [ref=e14] [cursor=pointer]:
              - /url: /wishlist
              - generic [ref=e15]: Your
              - generic [ref=e16]: Wishlist
          - listitem [ref=e17]:
            - link "🛒" [ref=e18] [cursor=pointer]:
              - /url: /cart
              - generic [ref=e20]: 🛒
          - listitem [ref=e21]:
            - link "Sign In" [ref=e22] [cursor=pointer]:
              - /url: /login
              - generic [ref=e23]: Sign In
  - navigation "breadcrumb" [ref=e24]:
    - list [ref=e25]:
      - listitem [ref=e26]:
        - link "Home" [ref=e27] [cursor=pointer]:
          - /url: /
      - listitem [ref=e28]: / Cart
  - generic [ref=e29]:
    - heading "Your Cart is Empty" [level=2] [ref=e30]
    - button "Browse Products" [ref=e31] [cursor=pointer]
```