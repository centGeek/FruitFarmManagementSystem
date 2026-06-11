package fruit.farm.management.service;

import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.dto.WorkEntryDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("DailySalaryCalculator")
class DailySalaryCalculatorTest {

    @Test
    @DisplayName("multiplies hours by hourly rate when paid hourly")
    void calculateDailySalary_whenPaidHourly_multipliesHoursByRate() {
        WorkEntryDto entry = new WorkEntryDto();
        entry.setDuration(8);
        WorkDetailsDto details = new WorkDetailsDto();
        details.setIsPaidHourly(true);
        details.setHourlyPay(new BigDecimal("25.50"));

        BigDecimal salary = DailySalaryCalculator.calculateDailySalary(entry, details);

        assertThat(salary).isEqualByComparingTo("204.00"); // 8 * 25.50
    }

    @Test
    @DisplayName("multiplies kilograms by per-kg rate when not paid hourly")
    void calculateDailySalary_whenPaidPerKilogram_multipliesKilogramsByRate() {
        WorkEntryDto entry = new WorkEntryDto();
        entry.setKilogramsPicked(120);
        WorkDetailsDto details = new WorkDetailsDto();
        details.setIsPaidHourly(false);
        details.setPayPerKilogram(new BigDecimal("1.20"));

        BigDecimal salary = DailySalaryCalculator.calculateDailySalary(entry, details);

        assertThat(salary).isEqualByComparingTo("144.00"); // 120 * 1.20
    }

    @Test
    @DisplayName("returns zero when hourly worker logged no hours")
    void calculateDailySalary_whenHourlyWithZeroHours_returnsZero() {
        WorkEntryDto entry = new WorkEntryDto();
        entry.setDuration(0);
        WorkDetailsDto details = new WorkDetailsDto();
        details.setIsPaidHourly(true);
        details.setHourlyPay(new BigDecimal("30.00"));

        BigDecimal salary = DailySalaryCalculator.calculateDailySalary(entry, details);

        assertThat(salary).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("ignores the per-kg rate when the worker is paid hourly")
    void calculateDailySalary_whenPaidHourly_ignoresPerKilogramRate() {
        WorkEntryDto entry = new WorkEntryDto();
        entry.setDuration(5);
        entry.setKilogramsPicked(100);
        WorkDetailsDto details = new WorkDetailsDto();
        details.setIsPaidHourly(true);
        details.setHourlyPay(new BigDecimal("20.00"));
        details.setPayPerKilogram(new BigDecimal("1.50"));

        BigDecimal salary = DailySalaryCalculator.calculateDailySalary(entry, details);

        assertThat(salary).isEqualByComparingTo("100.00"); // 5 * 20.00, not 100 * 1.50
    }
}
