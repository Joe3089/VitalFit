package reporthandlers

import (
	"encoding/csv"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-pdf/fpdf"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

// @Summary		Get Weekly Revenue KPI
// @Description	Retrieves total revenue (sum of completed payments) for the current week compared to the previous week.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Weekly revenue KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/weekly-revenue [get]
func (h *ReportHanlders) GetWeeklyRevenueKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	kpi, err := h.services.ReportServices.GetWeeklyRevenueKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Export Financial Report (CSV)
// @Description	Exports a detailed financial report. Supports CSV, Excel, and PDF formats.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Produce		application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Produce		application/pdf
// @Param			branch_id	query		string					false	"Filter by Branch UUID"
// @Param			start		query		string					false	"Start date (YYYY-MM-DD)"
// @Param			end			query		string					false	"End date (YYYY-MM-DD)"
// @Param			type		query		string					false	"Export format: csv, excel, pdf"	default(csv)
// @Success		200			{file}		file					"financial_report"
// @Failure		500			{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/export/financial [get]
func (h *ReportHanlders) ExportFinancialReportHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	exportType := c.DefaultQuery("type", "csv")

	data, err := h.services.ReportServices.GetFinancialReportData(ctx, branchID, start, end)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	switch exportType {
	case "excel":
		f := excelize.NewFile()
		defer func() {
			if err := f.Close(); err != nil {
				h.services.LogErrors.InternalServerError(c, err)
			}
		}()

		sheetName := "Financial Report"
		index, _ := f.NewSheet(sheetName)
		f.SetActiveSheet(index)
		f.DeleteSheet("Sheet1")

		headers := []interface{}{"Date", "Branch", "Client", "Category", "Concept", "Amount", "Status"}
		f.SetSheetRow(sheetName, "A1", &headers)

		for i, row := range data {
			cell, _ := excelize.CoordinatesToCellName(1, i+2)
			values := []interface{}{
				row.Date.Format("2006-01-02"),
				row.BranchName,
				row.ClientName,
				row.Category,
				row.Concept,
				row.Amount.InexactFloat64(),
				row.Status,
			}
			f.SetSheetRow(sheetName, cell, &values)
		}

		c.Header("Content-Disposition", "attachment; filename=financial_report.xlsx")
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		if err := f.Write(c.Writer); err != nil {
			h.services.LogErrors.InternalServerError(c, err)
		}

	case "pdf":
		pdf := fpdf.New("L", "mm", "A4", "")
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 10)

		// Headers
		headers := []string{"Date", "Branch", "Client", "Category", "Concept", "Amount", "Status"}
		widths := []float64{25, 40, 50, 30, 50, 30, 30}

		for i, header := range headers {
			pdf.CellFormat(widths[i], 10, header, "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)

		pdf.SetFont("Arial", "", 9)
		for _, row := range data {
			pdf.CellFormat(widths[0], 8, row.Date.Format("2006-01-02"), "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[1], 8, row.BranchName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[2], 8, row.ClientName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[3], 8, row.Category, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[4], 8, row.Concept, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[5], 8, row.Amount.StringFixed(2), "1", 0, "R", false, 0, "")
			pdf.CellFormat(widths[6], 8, row.Status, "1", 0, "C", false, 0, "")
			pdf.Ln(-1)
		}

		c.Header("Content-Disposition", "attachment; filename=financial_report.pdf")
		c.Header("Content-Type", "application/pdf")
		if err := pdf.Output(c.Writer); err != nil {
			h.services.LogErrors.InternalServerError(c, err)
		}

	default: // csv
		c.Header("Content-Disposition", "attachment; filename=financial_report.csv")
		c.Header("Content-Type", "text/csv")

		writer := csv.NewWriter(c.Writer)
		defer writer.Flush()

		// Header
		writer.Write([]string{"Date", "Branch", "Client", "Category", "Concept", "Amount", "Status"})

		for _, row := range data {
			writer.Write([]string{
				row.Date.Format("2006-01-02"),
				row.BranchName,
				row.ClientName,
				row.Category,
				row.Concept,
				row.Amount.StringFixed(2),
				row.Status,
			})
		}
	}
}

// @Summary		Export Client Report
// @Description	Exports a detailed client report including retention metrics, last activity, and risk status. Supports CSV, Excel, and PDF.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Produce		application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Produce		application/pdf
// @Param			type	query		string					false	"Export format: csv, excel, pdf"	default(csv)
// @Success		200		{file}		file					"client_report"
// @Failure		500		{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/export/clients [get]
func (h *ReportHanlders) ExportClientReportHandler(c *gin.Context) {
	ctx := c.Request.Context()
	exportType := c.DefaultQuery("type", "csv")

	data, err := h.services.ReportServices.GetClientReportData(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	switch exportType {
	case "excel":
		f := excelize.NewFile()
		defer func() {
			if err := f.Close(); err != nil {
				h.services.LogErrors.InternalServerError(c, err)
			}
		}()

		sheetName := "Client Report"
		index, _ := f.NewSheet(sheetName)
		f.SetActiveSheet(index)
		f.DeleteSheet("Sheet1")

		headers := []interface{}{"Client Name", "Email", "Phone", "Category", "Last Check-In", "Visits (Current Month)", "Visits (Last Month)", "Membership End Date"}
		f.SetSheetRow(sheetName, "A1", &headers)

		for i, row := range data {
			lastCheckIn := "Never"
			if row.LastCheckIn != nil {
				lastCheckIn = row.LastCheckIn.Format("2006-01-02 15:04")
			}
			memEndDate := "N/A"
			if row.MembershipEndDate != nil {
				memEndDate = row.MembershipEndDate.Format("2006-01-02")
			}

			cell, _ := excelize.CoordinatesToCellName(1, i+2)
			values := []interface{}{
				row.FirstName + " " + row.LastName,
				row.Email,
				row.Phone,
				row.CurrentCategory,
				lastCheckIn,
				row.CurrentMonthVisits,
				row.LastMonthVisits,
				memEndDate,
			}
			f.SetSheetRow(sheetName, cell, &values)
		}

		c.Header("Content-Disposition", "attachment; filename=client_report.xlsx")
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		if err := f.Write(c.Writer); err != nil {
			h.services.LogErrors.InternalServerError(c, err)
		}

	case "pdf":
		pdf := fpdf.New("L", "mm", "A4", "")
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 10)

		headers := []string{"Client Name", "Email", "Phone", "Category", "Last Check-In", "Visits (Cur)", "Visits (Last)", "End Date"}
		widths := []float64{40, 50, 30, 25, 35, 20, 20, 25}

		for i, header := range headers {
			pdf.CellFormat(widths[i], 10, header, "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)

		pdf.SetFont("Arial", "", 9)
		for _, row := range data {
			lastCheckIn := "Never"
			if row.LastCheckIn != nil {
				lastCheckIn = row.LastCheckIn.Format("2006-01-02 15:04")
			}
			memEndDate := "N/A"
			if row.MembershipEndDate != nil {
				memEndDate = row.MembershipEndDate.Format("2006-01-02")
			}

			pdf.CellFormat(widths[0], 8, row.FirstName+" "+row.LastName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[1], 8, row.Email, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[2], 8, row.Phone, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[3], 8, row.CurrentCategory, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[4], 8, lastCheckIn, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[5], 8, strconv.FormatInt(row.CurrentMonthVisits, 10), "1", 0, "C", false, 0, "")
			pdf.CellFormat(widths[6], 8, strconv.FormatInt(row.LastMonthVisits, 10), "1", 0, "C", false, 0, "")
			pdf.CellFormat(widths[7], 8, memEndDate, "1", 0, "L", false, 0, "")
			pdf.Ln(-1)
		}

		c.Header("Content-Disposition", "attachment; filename=client_report.pdf")
		c.Header("Content-Type", "application/pdf")
		if err := pdf.Output(c.Writer); err != nil {
			h.services.LogErrors.InternalServerError(c, err)
		}

	default: // csv
		c.Header("Content-Disposition", "attachment; filename=client_report.csv")
		c.Header("Content-Type", "text/csv")

		writer := csv.NewWriter(c.Writer)
		defer writer.Flush()

		// Header
		writer.Write([]string{"Client Name", "Email", "Phone", "Category", "Last Check-In", "Visits (Current Month)", "Visits (Last Month)", "Membership End Date"})

		for _, row := range data {
			lastCheckIn := "Never"
			if row.LastCheckIn != nil {
				lastCheckIn = row.LastCheckIn.Format("2006-01-02 15:04")
			}
			memEndDate := "N/A"
			if row.MembershipEndDate != nil {
				memEndDate = row.MembershipEndDate.Format("2006-01-02")
			}

			writer.Write([]string{
				row.FirstName + " " + row.LastName,
				row.Email,
				row.Phone,
				row.CurrentCategory,
				lastCheckIn,
				strconv.FormatInt(row.CurrentMonthVisits, 10),
				strconv.FormatInt(row.LastMonthVisits, 10),
				memEndDate,
			})
		}
	}
}

// @Summary		Export Sales Report
// @Description	Exports a detailed sales report. Supports CSV, Excel, and PDF.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Produce		application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Produce		application/pdf
// @Param			branch_id	query		string					false	"Filter by Branch UUID"
// @Param			start		query		string					false	"Start date (YYYY-MM-DD)"
// @Param			end			query		string					false	"End date (YYYY-MM-DD)"
// @Param			type		query		string					false	"Export format: csv, excel, pdf"	default(csv)
// @Success		200			{file}		file					"sales_report"
// @Failure		500			{object}	object{error=string}	"Internal Server Error"
// @Router			/reports/export/sales [get]
func (h *ReportHanlders) ExportSalesReportHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	exportType := c.DefaultQuery("type", "csv")

	data, err := h.services.ReportServices.GetSalesReportData(ctx, branchID, start, end)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	switch exportType {
	case "excel":
		f := excelize.NewFile()
		defer func() {
			if err := f.Close(); err != nil {
				h.services.LogErrors.InternalServerError(c, err)
			}
		}()

		sheetName := "Sales Report"
		index, _ := f.NewSheet(sheetName)
		f.SetActiveSheet(index)
		f.DeleteSheet("Sheet1")

		headers := []interface{}{"Date", "Branch", "Item", "Category", "Quantity", "Total", "Payment Method"}
		f.SetSheetRow(sheetName, "A1", &headers)

		for i, row := range data {
			cell, _ := excelize.CoordinatesToCellName(1, i+2)
			values := []interface{}{
				row.Date.Format("2006-01-02"),
				row.BranchName,
				row.ItemName,
				row.Category,
				row.Quantity,
				row.Total.InexactFloat64(),
				row.PaymentMethod,
			}
			f.SetSheetRow(sheetName, cell, &values)
		}

		c.Header("Content-Disposition", "attachment; filename=sales_report.xlsx")
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		if err := f.Write(c.Writer); err != nil {
			h.services.LogErrors.InternalServerError(c, err)
		}

	case "pdf":
		pdf := fpdf.New("L", "mm", "A4", "")
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 10)

		headers := []string{"Date", "Branch", "Item", "Category", "Quantity", "Total", "Payment Method"}
		widths := []float64{25, 40, 50, 30, 20, 30, 40}

		for i, header := range headers {
			pdf.CellFormat(widths[i], 10, header, "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)

		pdf.SetFont("Arial", "", 9)
		for _, row := range data {
			pdf.CellFormat(widths[0], 8, row.Date.Format("2006-01-02"), "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[1], 8, row.BranchName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[2], 8, row.ItemName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[3], 8, row.Category, "1", 0, "L", false, 0, "")
			pdf.CellFormat(widths[4], 8, strconv.Itoa(row.Quantity), "1", 0, "C", false, 0, "")
			pdf.CellFormat(widths[5], 8, row.Total.StringFixed(2), "1", 0, "R", false, 0, "")
			pdf.CellFormat(widths[6], 8, row.PaymentMethod, "1", 0, "L", false, 0, "")
			pdf.Ln(-1)
		}

		c.Header("Content-Disposition", "attachment; filename=sales_report.pdf")
		c.Header("Content-Type", "application/pdf")
		if err := pdf.Output(c.Writer); err != nil {
			h.services.LogErrors.InternalServerError(c, err)
		}

	default: // csv
		c.Header("Content-Disposition", "attachment; filename=sales_report.csv")
		c.Header("Content-Type", "text/csv")

		writer := csv.NewWriter(c.Writer)
		defer writer.Flush()

		// Header
		writer.Write([]string{"Date", "Branch", "Item", "Category", "Quantity", "Total", "Payment Method"})

		for _, row := range data {
			writer.Write([]string{
				row.Date.Format("2006-01-02"),
				row.BranchName,
				row.ItemName,
				row.Category,
				strconv.Itoa(row.Quantity),
				row.Total.StringFixed(2),
				row.PaymentMethod,
			})
		}
	}
}

// @Summary		Get Monthly Recurring Revenue (MRR) KPI
// @Description	Retrieves the sum of revenue generated solely from memberships (excluding one-time products/services) for the current month.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"MRR KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/mrr [get]
func (h *ReportHanlders) GetMonthlyRecurringRevenueKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	kpi, err := h.services.ReportServices.GetMonthlyRecurringRevenueKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Accounts Receivable KPI
// @Description	Retrieves the total outstanding debt (Accounts Receivable) from unpaid or overdue invoices of active users.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Accounts Receivable KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/accounts-receivable [get]
func (h *ReportHanlders) GetAccountsReceivableKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	kpi, err := h.services.ReportServices.GetAccountsReceivableKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Average Ticket KPI
// @Description	Retrieves the average transaction value (Total Revenue / Number of Transactions) for the current month compared to the previous month.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Average Ticket KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/average-ticket [get]
func (h *ReportHanlders) GetAverageTicketKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	kpi, err := h.services.ReportServices.GetAverageTicketKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Monthly Revenue Chart
// @Description	Retrieves total revenue per month for the current year.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string									false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.ChartData}	"Monthly revenue data"
// @Failure		500			{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/monthly-revenue [get]
func (h *ReportHanlders) GetMonthlyRevenueChartHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	data, err := h.services.ReportServices.GetMonthlyRevenueChart(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Billing Detail by Branch Matrix
// @Description	Retrieves a comparative matrix of revenue by concept (rows) and branch (columns).
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			start	query		string									false	"Start date (YYYY-MM-DD)"
// @Param			end		query		string									false	"End date (YYYY-MM-DD)"
// @Success		200		{object}	object{data=reportdomain.BillingMatrix}	"Billing matrix data"
// @Failure		500		{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/kpi/billing-matrix [get]
func (h *ReportHanlders) GetBillingByBranchMatrixHandler(c *gin.Context) {
	ctx := c.Request.Context()
	start, end := parseTimeRange(c)
	matrix, err := h.services.ReportServices.GetBillingByBranchMatrix(ctx, start, end)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": matrix})
}

// @Summary		Get Total Transactions Stats
// @Description	Retrieves the total lifetime count of completed transactions (payments). Supports filtering by branch. Includes a trend comparison (current month vs previous month).
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Total transactions KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/total-transactions [get]
func (h *ReportHanlders) GetTotalTransactionsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	kpi, err := h.services.ReportServices.GetTotalTransactions(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}

// @Summary		Get Monthly Cash Flow Chart
// @Description	Retrieves total actual income (cash flow) from completed payments per month for the current year.
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string									false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=[]reportdomain.ChartData}	"Monthly cash flow data"
// @Failure		500			{object}	object{error=string}					"Internal Server Error"
// @Router			/reports/charts/cash-flow [get]
func (h *ReportHanlders) GetMonthlyCashFlowChartHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	data, err := h.services.ReportServices.GetMonthlyCashFlowChart(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// @Summary		Get Average Customer Lifetime Value (CLV) KPI
// @Description	Retrieves the average revenue generated per customer (Historical Revenue / Unique Paying Customers).
// @Tags			Reports Financial
// @Security		ApiKeyAuth
// @Produce		json
// @Param			branch_id	query		string								false	"Filter by Branch UUID"
// @Success		200			{object}	object{data=reportdomain.KPICard}	"Average CLV KPI"
// @Failure		500			{object}	object{error=string}				"Internal Server Error"
// @Router			/reports/kpi/clv [get]
func (h *ReportHanlders) GetAverageCLVKPIHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var branchID *uuid.UUID
	if idStr := c.Query("branch_id"); idStr != "" {
		if id, err := uuid.Parse(idStr); err == nil {
			branchID = &id
		}
	}
	kpi, err := h.services.ReportServices.GetAverageCLVKPI(ctx, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": kpi})
}
