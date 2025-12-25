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
            - link "Your Wishlist" [active] [ref=e14] [cursor=pointer]:
              - /url: /wishlist
              - generic [ref=e15]: Your
              - generic [ref=e16]: Wishlist
          - listitem [ref=e17]:
            - link "Returns & Orders" [ref=e18] [cursor=pointer]:
              - /url: /my-orders
              - generic [ref=e19]: Returns
              - generic [ref=e20]: "& Orders"
          - listitem [ref=e21]:
            - link "🛒" [ref=e22] [cursor=pointer]:
              - /url: /cart
              - generic [ref=e24]: 🛒
          - listitem [ref=e25]:
            - button "Hello, test_user_1766688743408_jhwdw Account" [ref=e26] [cursor=pointer]:
              - generic [ref=e27]: Hello, test_user_1766688743408_jhwdw
              - generic [ref=e28]: Account
  - generic [ref=e29]:
    - heading "Your Wishlist is Empty" [level=2] [ref=e30]
    - paragraph [ref=e31]: Save your favorite items here!
    - button "Browse Products" [ref=e32] [cursor=pointer]
```