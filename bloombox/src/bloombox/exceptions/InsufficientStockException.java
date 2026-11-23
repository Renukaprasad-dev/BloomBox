package bloombox.exceptions;

/** Checked exception: the order asks for more than the available stock. */
public class InsufficientStockException extends Exception {
    public InsufficientStockException(String itemName, int requested, int available) {
        super("Not enough stock for " + itemName + ": requested " + requested
                + ", available " + available + ".");
    }
}
