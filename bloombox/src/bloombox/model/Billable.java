package bloombox.model;

/** Anything that can be billed. */
public interface Billable {
    double getSubtotal();

    double getDiscount();

    double getGst();

    double getFinalTotal();
}
