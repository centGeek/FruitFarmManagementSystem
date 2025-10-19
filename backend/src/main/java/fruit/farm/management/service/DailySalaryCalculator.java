package fruit.farm.management.service;

import fruit.farm.management.dto.WorkDetailsDTO;
import fruit.farm.management.dto.WorkEntryDto;

import java.math.BigDecimal;

public class DailySalaryCalculator {


    public static BigDecimal calculateDailySalary(WorkEntryDto workEntryDto, WorkDetailsDTO workDetailsDTO) {
        BigDecimal salary;
        if (workDetailsDTO.getIsPaidHourly()) {
            salary = BigDecimal.valueOf(workEntryDto.getDuration()).multiply(workDetailsDTO.getHourlyPay());
        } else {
            salary = BigDecimal.valueOf(workEntryDto.getKilogramsPicked()).multiply(workDetailsDTO.getPayPerKilogram());
        }
        return salary;
    }
}
