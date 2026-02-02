package fruit.farm.management.mapper;

import fruit.farm.management.dto.ExpenseDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ExpenseEntity;

public class ExpenseMapper {

    public static ExpenseEntity mapToEntity(ExpenseDto expenseDTO, UserDto user) {

        if (expenseDTO.getSectorDTO() == null) {
            return new ExpenseEntity(expenseDTO.getType(), expenseDTO.getAmount(), expenseDTO.getDescription(),
                    expenseDTO.getCreatedAt(), UserMapper.mapToEntity(user, null), expenseDTO.isPaid(), null);
        }
        return new ExpenseEntity(expenseDTO.getType(), expenseDTO.getAmount(), expenseDTO.getDescription(),
                expenseDTO.getCreatedAt(), UserMapper.mapToEntity(user, null), expenseDTO.isPaid(),
                SectorMapper.mapFromDTO(expenseDTO.getSectorDTO(), user));
    }

    public static ExpenseDto mapFromEntity(ExpenseEntity expenseEntity) {

        if (expenseEntity.getSectorEntity() == null) {
            return new ExpenseDto(expenseEntity.getExpenseId(), expenseEntity.getProductType(),
                    expenseEntity.getExpenseCost(), expenseEntity.getCreatedAt(), expenseEntity.getDescription(),
                    expenseEntity.isPaid(), expenseEntity.getUserEntity().getId(), null);
        }
        return new ExpenseDto(expenseEntity.getExpenseId(), expenseEntity.getProductType(), expenseEntity.getExpenseCost(),
                expenseEntity.getCreatedAt(), expenseEntity.getDescription(), expenseEntity.isPaid(),
                expenseEntity.getUserEntity().getId(), SectorMapper.mapToDTO(expenseEntity.getSectorEntity()));
    }
}
