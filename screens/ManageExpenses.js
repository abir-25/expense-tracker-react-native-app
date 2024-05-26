import React, { useContext, useLayoutEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import IconButton from "../components/UI/IconButton";
import { GlobalStyles } from "../constants/styles";
import Button from "../components/UI/Button";
import { ExpensesContext } from "../store/expenses-context";
import { getFormattedDate } from "../util/date";
import { deleteExpenses, storeExpense, updateExpenses } from "../util/http";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import ErrorOverlay from "../components/UI/ErrorOverlay";

const ManageExpenses = ({ route, navigation }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const expenseCtx = useContext(ExpensesContext);

  const editedExpenseId = route.params?.expenseId;
  const isEditing = !!editedExpenseId; //convert value into boolean

  const [expenseData, setExpenseData] = useState({
    id: 0,
    description: "",
    amount: 0,
    date: "",
  });

  function expenseAddInputHandler(name, value) {
    if (name === "amount") {
      value = Number(value);
    }
    setExpenseData((currentExpenseData) => ({
      ...currentExpenseData,
      [name]: value,
    }));
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Edit Expense" : "Add Expense",
    });
    if (isEditing) {
      const editExpenseData = expenseCtx.expenses.filter(
        (expense) => expense.id === editedExpenseId
      )[0];

      const updatedExpenseData = { ...editExpenseData };
      updatedExpenseData.amount = updatedExpenseData.amount.toString();
      updatedExpenseData.date = getFormattedDate(updatedExpenseData.date);
      setExpenseData(updatedExpenseData);
    }
  }, [navigation, isEditing]);

  async function deleteExpenseHandler() {
    setIsSubmitting(true);
    try {
      await deleteExpenses(editedExpenseId);
      expenseCtx.deleteExpense(editedExpenseId);
      navigation.goBack();
    } catch (error) {
      setError("Could not delete expense! Please try again later");
      setIsSubmitting(false);
    }
  }

  function cancelHandler() {
    navigation.goBack();
  }

  async function confirmHandler() {
    setIsSubmitting(true);

    try {
      if (isEditing) {
        const updatedExpenseData = { ...expenseData };

        const { id, ...updatedExpenseDataWithoutId } = updatedExpenseData;

        updatedExpenseDataWithoutId.amount = Number(
          updatedExpenseDataWithoutId.amount
        );
        updatedExpenseDataWithoutId.date = new Date(
          updatedExpenseDataWithoutId.date
        );

        expenseCtx.updateExpense(editedExpenseId, updatedExpenseDataWithoutId);
        await updateExpenses(editedExpenseId, updatedExpenseDataWithoutId);
      } else {
        const newExpenseData = { ...expenseData };
        newExpenseData.date = new Date(newExpenseData.date);
        const id = await storeExpense(newExpenseData);

        newExpenseData.id = id;
        expenseCtx.addExpense({
          expenseData: newExpenseData,
        });
      }
      navigation.goBack();
    } catch (error) {
      setError("Could not save expense! Please try again later");
      setIsSubmitting(false);
    }
  }

  function errorHandler() {
    setError(null);
  }

  if (error && !isSubmitting) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }

  if (isSubmitting) {
    return <LoadingOverlay />;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.topTitle}>Your Expense</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputInnerContainer}>
          <View>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Expense Amount"
              onChangeText={(text) => expenseAddInputHandler("amount", text)}
              value={expenseData.amount}
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              onChangeText={(text) => expenseAddInputHandler("date", text)}
              value={expenseData.date}
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Expense Description"
          onChangeText={(text) => expenseAddInputHandler("description", text)}
          value={expenseData.description}
          multiline={true}
          numberOfLines={4}
        />
      </View>
      <View style={styles.buttons}>
        <Button style={styles.button} mode="flat" onPress={cancelHandler}>
          Cancel
        </Button>
        <Button style={styles.button} onPress={confirmHandler}>
          {isEditing ? "Update" : "Add"}
        </Button>
      </View>
      {isEditing && (
        <View style={styles.deleteContainer}>
          <IconButton
            icon="trash"
            color={GlobalStyles.colors.error500}
            size={36}
            onPress={deleteExpenseHandler}
          ></IconButton>
        </View>
      )}
    </View>
  );
};

export default ManageExpenses;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: GlobalStyles.colors.primary800,
  },
  topTitle: {
    fontSize: 24,
    color: "#ffffff",
    textAlign: "center",
    paddingVertical: 30,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputInnerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inputLabel: {
    color: "#ffffff",
  },
  textInput: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primary50,
    backgroundColor: GlobalStyles.colors.primary50,
    width: 150,
    paddingHorizontal: 13,
    paddingVertical: 8,
    color: "#120438",
    borderRadius: 6,
    marginBottom: 8,
  },
  textArea: {
    width: "100%",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: "center",
  },
});
