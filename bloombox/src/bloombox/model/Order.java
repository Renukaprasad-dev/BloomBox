package bloombox.model;

import bloombox.exceptions.InsufficientStockException;

public class Order implements Billable {
    public static final double GST = 0.05;

    /** Shared by every order: next id/token to hand out. */
    private static int counter = 0;

    private final Customer customer;
    private final ItemStack lines = new ItemStack();
    private String orderId;
    private int token;
    private boolean confirmed;

    public Order(Customer customer) {
        this.customer = customer;
        this.confirmed = false;
    }

    // ---- building the order -------------------------------------------------

    /** Quantity of this item already in the (unconfirmed) order. */
    private int reservedQty(FlowerItem item) {
        int total = 0;
        for (int i = 0; i < lines.size(); i++) {
            if (lines.get(i).getItem() == item) {
                total += lines.get(i).getQuantity();
            }
        }
        return total;
    }

    /** Adds a line after checking stock. Stock itself is NOT changed here. */
    public void addLine(FlowerItem item, int qty) throws InsufficientStockException {
        int available = item.getStock() - reservedQty(item);
        if (qty > available) {
            throw new InsufficientStockException(item.getName(), qty, available);
        }
        lines.push(new OrderLine(item, qty));
    }

    /** Overload: add an already-built line. */
    public void addLine(OrderLine line) throws InsufficientStockException {
        addLine(line.getItem(), line.getQuantity());
    }

    /** Undo the last flower item added (-1). */
    public OrderLine undoLast() {
        return lines.pop();
    }

    public boolean isEmpty() {
        return lines.isEmpty();
    }

    /** Confirms the order: assigns id + token and finally reduces stock. */
    public void confirm() {
        for (int i = 0; i < lines.size(); i++) {
            lines.get(i).getItem().reduceStock(lines.get(i).getQuantity());
        }
        counter++;
        this.token = counter;
        this.orderId = "FLW" + counter;
        this.confirmed = true;
    }

    // ---- billing --------------------------------------------------------------

    /** Overloaded: whole-order subtotal. */
    public double subtotal() {
        return subtotal(lines.size());
    }

    /** Overloaded + recursive: subtotal of the first n lines. */
    public double subtotal(int n) {
        if (n == 0) {
            return 0;
        }
        return lines.get(n - 1).getTotal() + subtotal(n - 1);
    }

    @Override
    public double getSubtotal() {
        return subtotal();
    }

    @Override
    public double getDiscount() {
        return getSubtotal() * customer.getDiscountRate();
    }

    @Override
    public double getGst() {
        return (getSubtotal() - getDiscount()) * GST;
    }

    @Override
    public double getFinalTotal() {
        return getSubtotal() - getDiscount() + getGst();
    }

    // ---- getters ----------------------------------------------------------------

    public String getOrderId() { return orderId; }
    public int getToken() { return token; }
    public Customer getCustomer() { return customer; }
    public boolean isConfirmed() { return confirmed; }
    public int lineCount() { return lines.size(); }
    public OrderLine getLine(int i) { return lines.get(i); }

    /** Odd tokens -> Rider 1, even tokens -> Rider 2 (token & 1). */
    public String getRider() {
        return (token & 1) == 1 ? "Rider 1" : "Rider 2";
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("==================== BLOOMBOX BILL ====================\n");
        sb.append(String.format("Order id : %s    Token : %d    Delivery : %s%n",
                orderId, token, getRider()));
        sb.append("Customer : ").append(customer.describe()).append('\n');
        sb.append("-------------------------------------------------------\n");
        sb.append(String.format("%-20s %5s %10s %12s%n", "Item", "Qty", "Price", "Amount"));
        for (int i = 0; i < lines.size(); i++) {
            OrderLine l = lines.get(i);
            sb.append(String.format("%-20s %5d %10.2f %12.2f%n",
                    l.getItem().getName(), l.getQuantity(), l.getItem().getPrice(), l.getTotal()));
        }
        sb.append("-------------------------------------------------------\n");
        int pct = (int) (customer.getDiscountRate() * 100); // type casting double -> int
        sb.append(String.format("%-38s %12.2f%n", "Subtotal", getSubtotal()));
        sb.append(String.format("%-38s %12.2f%n", "Less: Discount (" + pct + "%)", getDiscount()));
        sb.append(String.format("%-38s %12.2f%n", "GST (5%)", getGst()));
        sb.append(String.format("%-38s %12.2f%n", "FINAL TOTAL (Rs.)", getFinalTotal()));
        sb.append("=======================================================");
        return sb.toString();
    }
}
