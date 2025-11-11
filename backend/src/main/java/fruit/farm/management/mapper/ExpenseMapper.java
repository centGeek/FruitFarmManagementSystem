package fruit.farm.management.mapper;

import fruit.farm.management.dto.ExpenseDTO;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.UserEntity;

import java.time.LocalDate;

public class ExpenseMapper {

    public static ExpenseEntity mapToEntity(ExpenseDTO expenseDTO, UserEntity user) {
        if (expenseDTO.getSectorDTO() == null) {
            return new ExpenseEntity(expenseDTO.getType(), expenseDTO.getAmount(), expenseDTO.getDescription(), expenseDTO.getCreatedAt(), user, expenseDTO.isPaid(), null);
        }
        return new ExpenseEntity(expenseDTO.getType(), expenseDTO.getAmount(), expenseDTO.getDescription(), expenseDTO.getCreatedAt(), user, expenseDTO.isPaid(), SectorMapper.mapFromDTO(expenseDTO.getSectorDTO(), UserMapper.mapFromEntity(user)));
    }

    public static ExpenseDTO mapFromEntity(ExpenseEntity expenseEntity) {
        if (expenseEntity.getSectorEntity() == null) {
            return new ExpenseDTO(expenseEntity.getExpenseId(), expenseEntity.getProductType(), expenseEntity.getExpenseCost(), expenseEntity.getCreatedAt(), expenseEntity.getDescription(), expenseEntity.isPaid(), expenseEntity.getUserEntity().getId(), null);
        }
        return new ExpenseDTO(expenseEntity.getExpenseId(), expenseEntity.getProductType(), expenseEntity.getExpenseCost(), expenseEntity.getCreatedAt(), expenseEntity.getDescription(), expenseEntity.isPaid(), expenseEntity.getUserEntity().getId(), SectorMapper.mapToDTO(expenseEntity.getSectorEntity()));
    }
}
