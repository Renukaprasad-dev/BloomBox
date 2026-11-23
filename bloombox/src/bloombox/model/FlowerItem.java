package bloombox.model;

public class FlowerItem {
    private final int id;
    private final String name;
    private final String category;
    private final double price;
    private int stock;
    private int sold;

    public FlowerItem(int id, String name, String category, double price, int stock) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.sold = 0;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public double getPrice() { return price; }
    public int getStock() { return stock; }
    public int getSold() { return sold; }

    /** LOW when stock is below 10, otherwise OK (uses the ?: operator). */
    public String getStatus() {
        return stock < 10 ? "LOW" : "OK";
    }

    /** Called only when an order is confirmed, so rejected orders never touch stock. */
    public void reduceStock(int qty) {
        this.stock -= qty;
        this.sold += qty;
    }

    @Override
    public String toString() {
        return String.format("%-5d %-18s %-10s %8.2f %6d  %s",
                id, name, category, price, stock, getStatus());
    }
}
