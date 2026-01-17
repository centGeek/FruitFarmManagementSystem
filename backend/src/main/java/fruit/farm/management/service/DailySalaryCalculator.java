package fruit.farm.management.service;

import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.dto.WorkEntryDto;

import java.math.BigDecimal;

public class DailySalaryCalculator {
    public static BigDecimal calculateDailySalary(WorkEntryDto workEntryDto, WorkDetailsDto workDetailsDto) {
        BigDecimal salary;
        if (workDetailsDto.getIsPaidHourly()) {
            salary = BigDecimal.valueOf(workEntryDto.getDuration()).multiply(workDetailsDto.getHourlyPay());
        } else {
            salary = BigDecimal.valueOf(workEntryDto.getKilogramsPicked()).multiply(workDetailsDto.getPayPerKilogram());
        }
        return salary;
    }
}


