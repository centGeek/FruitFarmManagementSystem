package fruit.farm.management.exception;

public class ExceededWorkHoursException extends RuntimeException {
    public ExceededWorkHoursException(String message) {
        super(message);
    }
}
