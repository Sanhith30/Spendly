import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Export to CSV
export function exportToCSV(expenses, income, monthlyBudgets, currency, currentMonth) {
  const currentBudget = monthlyBudgets[currentMonth] || 0;
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = currentBudget - totalSpent;
  const balance = income - totalSpent;

  // Prepare metadata rows
  const summaryData = [
    ['METRIC', 'VALUE'],
    ['Export Date', new Date().toLocaleDateString()],
    ['Target Month', currentMonth],
    ['Monthly Income', `${currency}${income}`],
    ['Monthly Budget', `${currency}${currentBudget}`],
    ['Total Monthly Expenses', `${currency}${totalSpent}`],
    ['Remaining Budget', `${currency}${remainingBudget}`],
    ['Net Balance', `${currency}${balance}`],
    [], // empty spacer
    ['EXPENSE LIST'],
    ['DATE', 'CATEGORY', 'AMOUNT', 'NOTE', 'CREATED AT']
  ];

  // Map expenses to tabular data
  const expenseRows = expenses.map(e => [
    e.date,
    e.category,
    e.amount,
    e.note || '',
    new Date(e.createdAt).toLocaleString()
  ]);

  const csvContent = Papa.unparse([...summaryData, ...expenseRows]);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ledger_report_${currentMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to PDF
export function exportToPDF(expenses, income, monthlyBudgets, currency, currentMonth) {
  const doc = new jsPDF();
  const currentBudget = monthlyBudgets[currentMonth] || 0;
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = currentBudget - totalSpent;
  const balance = income - totalSpent;

  // Document Title
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text('LEDGER - WEALTH REPORT', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Target Month: ${currentMonth}`, 14, 26);
  
  // Horizontal rule
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 30, 196, 30);

  // Summary Metrics Section
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Monthly Overview', 14, 40);

  const summaryHeaders = [['Metric', 'Amount']];
  const summaryRows = [
    ['Monthly Income', `${currency}${income.toLocaleString()}`],
    ['Monthly Budget', `${currency}${currentBudget.toLocaleString()}`],
    ['Total Spent', `${currency}${totalSpent.toLocaleString()}`],
    ['Remaining Budget', `${currency}${remainingBudget.toLocaleString()}`],
    ['Remaining Balance', `${currency}${balance.toLocaleString()}`],
  ];

  doc.autoTable({
    startY: 45,
    head: summaryHeaders,
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [8, 8, 8], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    margin: { left: 14, right: 14 }
  });

  // Expense List Section
  const nextY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('All Expenses Logged', 14, nextY);

  const expenseHeaders = [['Date', 'Category', 'Amount', 'Note']];
  const expenseRows = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(e => [
      e.date,
      e.category,
      `${currency}${e.amount.toLocaleString()}`,
      e.note || '-'
    ]);

  doc.autoTable({
    startY: nextY + 5,
    head: expenseHeaders,
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [8, 8, 8], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 }
  });

  // Save the PDF
  doc.save(`ledger_report_${currentMonth}.pdf`);
}
