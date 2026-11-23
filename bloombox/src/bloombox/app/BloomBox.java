package bloombox.app;

import bloombox.exceptions.FlowerItemNotFoundException;
import bloombox.exceptions.InsufficientStockException;
import bloombox.model.Customer;
import bloombox.model.EventPlanner;
import bloombox.model.FlowerItem;
import bloombox.model.Order;
import bloombox.model.OrderLine;
import bloombox.model.Regular;

import java.util.NoSuchElementException;
import java.util.Scanner;

/** BloomBox: menu-driven billing program for the flower shop. */
public class BloomBox {

    private static final int MAX_ORDERS = 200;

    private static FlowerItem[] items = {
        new FlowerItem(101, "Rose Bouquet",     "Bouquet", 450, 15),
        new FlowerItem(102, "Jasmine Garland",  "Garland", 120, 30),
        new FlowerItem(103, "Marigold (1 kg)",  "Loose",    90, 25),
        new FlowerItem(104, "Orchid Stem",      "Stem",    150, 20),
        new FlowerItem(105, "Table Decoration", "Decor",   800,  8),
        new FlowerItem(106, "Lily Bunch",       "Bouquet", 350, 12)
    };

    private static Order[] orders = new Order[MAX_ORDERS];
    private static int orderCount = 0;
    private static Scanner in;

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            in = scanner;
            int choice;
            do {
                printMenu();
                choice = readMenuChoice();
                switch (choice) {
                    case 1:
                        showItems();
                        break;
                    case 2:
                        newOrder();
                        break;
                    case 3:
                        viewBill();
                        break;
                    case 4:
                        salesReport();
                        break;
                    case 5:
                        System.out.println("Thank you for using BloomBox. Goodbye!");
                        break;
                    default:
                        System.out.println("Please choose a number from 1 to 5.");
                }
            } while (choice != 5);
        } catch (NoSuchElementException e) {
            System.out.println("\nInput ended. Goodbye!");
        }
    }

    // ---- menu & input helpers ----------------------------------------------------

    private static void printMenu() {
        System.out.println();
        System.out.println("===== BloomBox =====");
        System.out.println("1. View item list");
        System.out.println("2. New order");
        System.out.println("3. View bill");
        System.out.println("4. Sales report");
        System.out.println("5. Exit");
    }

    private static String readLine(String prompt) {
        System.out.print(prompt);
        return in.nextLine();
    }

    /** Returns 0 for invalid input so the menu simply asks again. */
    private static int readMenuChoice() {
        String s = readLine("Enter choice: ").trim();
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            System.out.println("'" + s + "' is not a number.");
            return 0;
        }
    }

    private static String readNonBlank(String prompt) {
        String s;
        do {
            s = readLine(prompt).trim();
            if (s.isEmpty()) {
                System.out.println("This cannot be empty.");
            }
        } while (s.isEmpty());
        return s;
    }

    // ---- 1. item list --------------------------------------------------------------

    private static void showItems() {
        System.out.println();
        System.out.printf("%-5s %-18s %-10s %8s %6s  %s%n",
                "Id", "Name", "Category", "Price", "Stock", "Status");
        System.out.println("-----------------------------------------------------------");
        for (int i = 0; i < items.length; i++) {
            System.out.println(items[i]);
        }
    }

    private static FlowerItem findItem(int id) throws FlowerItemNotFoundException {
        for (int i = 0; i < items.length; i++) {
            if (items[i].getId() == id) {
                return items[i];
            }
        }
        throw new FlowerItemNotFoundException(id);
    }

    // ---- 2. new order ----------------------------------------------------------------

    private static void newOrder() {
        if (orderCount == MAX_ORDERS) {
            System.out.println("Order book is full for today.");
            return;
        }

        String name = readNonBlank("Customer name: ");
        char type;
        do {
            String s = readLine("Customer type (R = Regular, E = Event Planner): ").trim().toUpperCase();
            type = s.isEmpty() ? ' ' : s.charAt(0);
            if (type != 'R' && type != 'E') {
                System.out.println("Please type R or E.");
            }
        } while (type != 'R' && type != 'E');

        Customer customer = (type == 'E') ? new EventPlanner(name) : new Regular(name);
        Order order = new Order(customer);

        boolean finished = false;
        try { // outer: always report that entry is closed
            while (!finished) {
                try { // nested: handles one entry at a time so the loop keeps running
                    int id = Integer.parseInt(readLine("Item id (-1 = undo last, 0 = finish): ").trim());
                    if (id == 0) {
                        finished = true;
                    } else if (id == -1) {
                        OrderLine removed = order.undoLast();
                        System.out.println(removed == null
                                ? "Nothing to undo."
                                : "Removed " + removed.getQuantity() + " x " + removed.getItem().getName());
                    } else {
                        FlowerItem item = findItem(id);
                        int qty = Integer.parseInt(readLine("Quantity for " + item.getName() + ": ").trim());
                        if (qty <= 0) {
                            System.out.println("Quantity must be at least 1.");
                        } else {
                            order.addLine(item, qty);
                            System.out.println("Added " + qty + " x " + item.getName());
                        }
                    }
                } catch (NumberFormatException e) {
                    System.out.println("Please enter a whole number (letters are not allowed).");
                } catch (FlowerItemNotFoundException | InsufficientStockException e) {
                    System.out.println("Rejected: " + e.getMessage());
                }
            }
        } finally {
            System.out.println("-- order entry closed --");
        }

        if (order.isEmpty()) {
            System.out.println("Order is empty, nothing was saved and stock is unchanged.");
            return;
        }
        order.confirm();
        orders[orderCount++] = order;
        System.out.println();
        System.out.println(order);
    }

    // ---- 3. view bill ------------------------------------------------------------------

    private static void viewBill() {
        String id = readLine("Enter order id (e.g. FLW1): ").trim();
        for (int i = 0; i < orderCount; i++) {
            if (orders[i].getOrderId().equalsIgnoreCase(id)) {
                System.out.println();
                System.out.println(orders[i]);
                return;
            }
        }
        System.out.println("No bill found for order id '" + id + "'.");
    }

    // ---- 4. sales report ----------------------------------------------------------------

    private static void salesReport() {
        double revenue = 0;
        for (int i = 0; i < orderCount; i++) {
            revenue += orders[i].getFinalTotal();
        }
        FlowerItem best = null;
        for (int i = 0; i < items.length; i++) {
            if (items[i].getSold() > 0 && (best == null || items[i].getSold() > best.getSold())) {
                best = items[i];
            }
        }
        System.out.println();
        System.out.println("===== Sales report =====");
        System.out.println("Total orders  : " + orderCount);
        System.out.printf("Total revenue : Rs. %.2f%n", revenue);
        System.out.println("Most popular  : " + (best == null
                ? "none yet"
                : best.getName() + " (" + best.getSold() + " sold)"));
    }
}
