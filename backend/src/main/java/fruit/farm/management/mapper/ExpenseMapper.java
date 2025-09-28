package fruit.farm.management.mapper;

import fruit.farm.management.dto.ExpenseDTO;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.UserEntity;

import java.time.LocalDate;

public class ExpenseMapper {

    public static ExpenseEntity mapToEntity(ExpenseDTO expenseDTO, UserEntity user){
        return new ExpenseEntity(expenseDTO.getType(), expenseDTO.getAmount(), expenseDTO.getDescription(), user, expenseDTO.isPaid());
    }

    public static ExpenseDTO mapFromEntity(ExpenseEntity expenseEntity) {
        return new ExpenseDTO(expenseEntity.getExpenseId(), expenseEntity.getProductType(), expenseEntity.getExpenseCost(),
                LocalDate.now(), expenseEntity.getDescription(), expenseEntity.isPaid(), expenseEntity.getUserEntity().getId());
    }
}
