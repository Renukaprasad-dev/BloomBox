package bloombox.exceptions;

/** Checked exception: the entered flower item id is not in the catalogue. */
public class FlowerItemNotFoundException extends Exception {
    public FlowerItemNotFoundException(int id) {
        super("Flower item id " + id + " does not exist.");
    }
}
