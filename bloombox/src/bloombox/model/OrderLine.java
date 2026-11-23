package bloombox.model;

/** One line of an order: a flower item and how many of it. */
public class OrderLine {
    private final FlowerItem item;
    private final int quantity;

    public OrderLine(FlowerItem item, int quantity) {
        this.item = item;
        this.quantity = quantity;
    }

    public FlowerItem getItem() { return item; }
    public int getQuantity() { return quantity; }

    public double getTotal() {
        return item.getPrice() * quantity;
    }
}
