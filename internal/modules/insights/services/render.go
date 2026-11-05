package insightsservices

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
	insightsdomain "github.com/vitalfit/api/internal/modules/insights/domain"
	"github.com/xuri/excelize/v2"
)

// table is the format-agnostic representation of a report.
type table struct {
	Title   string
	Period  string
	Headers []string
	Rows    [][]string
}

func hexToRGB(hex string) (int, int, int) {
	hex = strings.TrimPrefix(hex, "#")
	if len(hex) != 6 {
		return 245, 138, 36
	}
	v, err := strconv.ParseUint(hex, 16, 32)
	if err != nil {
		return 245, 138, 36
	}
	return int(v >> 16 & 0xff), int(v >> 8 & 0xff), int(v & 0xff)
}

func render(t table, format string, tpl insightsdomain.ReportTemplate, baseName string) (*insightsdomain.ReportFile, error) {
	stamp := time.Now().Format("20060102")
	switch format {
	case "csv":
		var buf bytes.Buffer
		buf.WriteString("\ufeff") // BOM so Excel opens UTF-8 correctly
		w := csv.NewWriter(&buf)
		_ = w.Write(t.Headers)
		_ = w.WriteAll(t.Rows)
		w.Flush()
		return &insightsdomain.ReportFile{Filename: fmt.Sprintf("%s_%s.csv", baseName, stamp), ContentType: "text/csv; charset=utf-8", Data: buf.Bytes()}, w.Error()
	case "excel":
		data, err := renderExcel(t, tpl)
		if err != nil {
			return nil, err
		}
		return &insightsdomain.ReportFile{Filename: fmt.Sprintf("%s_%s.xlsx", baseName, stamp), ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Data: data}, nil
	case "pdf":
		data, err := renderPDF(t, tpl)
		if err != nil {
			return nil, err
		}
		return &insightsdomain.ReportFile{Filename: fmt.Sprintf("%s_%s.pdf", baseName, stamp), ContentType: "application/pdf", Data: data}, nil
	}
	return nil, insightsdomain.ErrInvalidFormat
}

func renderExcel(t table, tpl insightsdomain.ReportTemplate) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()
	sheet := "Reporte"
	f.SetSheetName("Sheet1", sheet)
	color := strings.TrimPrefix(tpl.PrimaryColor, "#")

	titleStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Size: 14, Color: color}})
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{color}},
	})

	_ = f.SetCellValue(sheet, "A1", fmt.Sprintf("%s - %s", tpl.HeaderText, t.Title))
	_ = f.SetCellStyle(sheet, "A1", "A1", titleStyle)
	_ = f.SetCellValue(sheet, "A2", t.Period)
	for i, h := range t.Headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 4)
		_ = f.SetCellValue(sheet, cell, h)
		_ = f.SetCellStyle(sheet, cell, cell, headerStyle)
		col, _ := excelize.ColumnNumberToName(i + 1)
		_ = f.SetColWidth(sheet, col, col, 20)
	}
	for r, row := range t.Rows {
		for c, v := range row {
			cell, _ := excelize.CoordinatesToCellName(c+1, r+5)
			if n, err := strconv.ParseFloat(v, 64); err == nil {
				_ = f.SetCellValue(sheet, cell, n)
			} else {
				_ = f.SetCellValue(sheet, cell, v)
			}
		}
	}
	if tpl.FooterText != "" {
		cell, _ := excelize.CoordinatesToCellName(1, len(t.Rows)+6)
		_ = f.SetCellValue(sheet, cell, tpl.FooterText)
	}
	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func renderPDF(t table, tpl insightsdomain.ReportTemplate) ([]byte, error) {
	orientation := tpl.Orientation
	if orientation != "P" {
		orientation = "L"
	}
	pdf := fpdf.New(orientation, "mm", "A4", "")
	tr := pdf.UnicodeTranslatorFromDescriptor("")
	r, g, b := hexToRGB(tpl.PrimaryColor)
	footer := tpl.FooterText

	pdf.SetFooterFunc(func() {
		pdf.SetY(-12)
		pdf.SetFont("Arial", "I", 8)
		pdf.SetTextColor(120, 120, 120)
		pdf.CellFormat(0, 8, tr(fmt.Sprintf("%s    Página %d", footer, pdf.PageNo())), "", 0, "C", false, 0, "")
	})
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 16)
	pdf.SetTextColor(r, g, b)
	pdf.CellFormat(0, 10, tr(tpl.HeaderText), "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(40, 40, 40)
	pdf.CellFormat(0, 8, tr(t.Title), "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 9)
	pdf.CellFormat(0, 6, tr(t.Period+"  ·  Generado "+time.Now().Format("02/01/2006 15:04")), "", 1, "L", false, 0, "")
	pdf.Ln(3)

	pageW, _ := pdf.GetPageSize()
	left, _, right, _ := pdf.GetMargins()
	colW := (pageW - left - right) / float64(max(len(t.Headers), 1))

	drawHeader := func() {
		pdf.SetFont("Arial", "B", 8)
		pdf.SetFillColor(r, g, b)
		pdf.SetTextColor(255, 255, 255)
		for _, h := range t.Headers {
			pdf.CellFormat(colW, 7, tr(h), "1", 0, "C", true, 0, "")
		}
		pdf.Ln(-1)
		pdf.SetFont("Arial", "", 8)
		pdf.SetTextColor(30, 30, 30)
	}
	drawHeader()
	_, pageH := pdf.GetPageSize()
	for i, row := range t.Rows {
		if pdf.GetY() > pageH-20 {
			pdf.AddPage()
			drawHeader()
		}
		fill := i%2 == 1
		pdf.SetFillColor(245, 245, 245)
		for _, v := range row {
			text := tr(v)
			for pdf.GetStringWidth(text) > colW-2 && len(text) > 3 {
				text = text[:len(text)-4] + "..."
			}
			pdf.CellFormat(colW, 6, text, "1", 0, "L", fill, 0, "")
		}
		pdf.Ln(-1)
	}
	if len(t.Rows) == 0 {
		pdf.CellFormat(0, 8, tr("Sin datos para el período seleccionado"), "", 1, "C", false, 0, "")
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
