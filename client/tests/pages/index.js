import { NavBar } from './NavBar.js';
import { LoginPage } from './LoginPage.js';
import { RegisterPage } from './RegisterPage.js';
import { HomePage } from './HomePage.js';
import { ProductPage } from './ProductPage.js';
import { CartPage } from './CartPage.js';
import { OrdersPage } from './OrdersPage.js';
import { WishlistPage } from './WishlistPage.js';
import { AdminDashboardPage } from './AdminDashboardPage.js';

/**
 * Every page object of the application bound to one browser page.
 *
 * The application confirms many actions with native alert() and confirm() dialogs. They are accepted here so
 * a test never hangs on one, and their messages are recorded in `dialogs` so a test can assert on them.
 */
export class App {
    constructor(page) {
        this.page = page;
        this.dialogs = [];
        page.on('dialog', dialog => {
            this.dialogs.push(dialog.message());
            dialog.accept().catch(() => { });
        });

        this.nav = new NavBar(page);
        this.login = new LoginPage(page);
        this.register = new RegisterPage(page);
        this.home = new HomePage(page);
        this.product = new ProductPage(page);
        this.cart = new CartPage(page);
        this.orders = new OrdersPage(page);
        this.wishlist = new WishlistPage(page);
        this.admin = new AdminDashboardPage(page);
    }
}
