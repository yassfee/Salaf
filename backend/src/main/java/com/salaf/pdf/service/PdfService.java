package com.salaf.pdf.service;

import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.salaf.auth.entity.User;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.repository.LendRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final LendRequestRepository lendRequestRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");

    // Color scheme for PDF styling
    private static final Color PRIMARY_COLOR = new DeviceRgb(41, 128, 185);      // Blue #2980b9
    private static final Color SECONDARY_COLOR = new DeviceRgb(52, 152, 219);    // Light Blue #3498db
    private static final Color DARK_HEADER = new DeviceRgb(44, 62, 80);          // Dark Blue-Gray #2c3e50
    private static final Color LIGHT_HEADER = new DeviceRgb(236, 240, 241);      // Light Gray #ecf0f1
    private static final Color SUCCESS_COLOR = new DeviceRgb(39, 174, 96);       // Green #27ae60
    private static final Color WARNING_COLOR = new DeviceRgb(230, 126, 34);      // Orange #e67e22
    private static final Color DANGER_COLOR = new DeviceRgb(231, 76, 60);        // Red #e74c3c
    private static final Color TEXT_DARK = new DeviceRgb(44, 62, 80);            // Dark text #2c3e50
    private static final Color TEXT_LIGHT = ColorConstants.WHITE;                 // White text

    // Task 8 — FR-22, FR-23: generate a lend receipt PDF
    public byte[] generateLendReceipt(Long lendId, User user) {
        LendRequest lend = lendRequestRepository.findByIdAndLender(lendId, user)
                .orElseThrow(() -> new RuntimeException("Lend #" + lendId + " not found"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (Document doc = new Document(new PdfDocument(new PdfWriter(baos)))) {

            // Title with primary color
            doc.add(new Paragraph("Salaf — Lend Receipt")
                    .setBold()
                    .setFontSize(22)
                    .setFontColor(PRIMARY_COLOR)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(6));

            doc.add(new Paragraph("Generated: " + java.time.LocalDateTime.now().format(DATETIME_FMT))
                    .setFontSize(9)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            // Detail table with enhanced styling
            Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                    .useAllAvailableWidth();

            addStyledRow(table, "Lend ID", "#" + lend.getId(), DARK_HEADER, TEXT_LIGHT, true);
            addStyledRow(table, "Lender", user.getName(), LIGHT_HEADER, TEXT_DARK, false);
            addStyledRow(table, "Borrower", lend.getBorrower().getName(), LIGHT_HEADER, TEXT_DARK, false);
            addStyledRow(table, "Amount", "BD " + lend.getAmount().toPlainString(), LIGHT_HEADER, TEXT_DARK, false);
            
            // Color-code remaining balance based on amount
            Color balanceColor = lend.getRemainingBalance().compareTo(java.math.BigDecimal.ZERO) > 0 ? DANGER_COLOR : SUCCESS_COLOR;
            addStyledRow(table, "Remaining", "BD " + lend.getRemainingBalance().toPlainString(), LIGHT_HEADER, balanceColor, false);
            
            addStyledRow(table, "Due Date", lend.getDueDate().format(DATE_FMT), LIGHT_HEADER, TEXT_DARK, false);
            
            // Color-code status
            Color statusColor = getStatusColor(lend.getStatus().name());
            addStyledRow(table, "Status", lend.getStatus().name(), LIGHT_HEADER, statusColor, false);
            
            addStyledRow(table, "Created", lend.getCreatedAt().format(DATETIME_FMT), LIGHT_HEADER, TEXT_DARK, false);

            if (lend.getNote() != null && !lend.getNote().isBlank()) {
                addStyledRow(table, "Note", lend.getNote(), SECONDARY_COLOR, TEXT_LIGHT, false);
            }

            doc.add(table);
        }

        return baos.toByteArray();
    }

    // Generate receipt PDF for both lender and borrower
    public byte[] generateReceiptPdf(Long lendId, User currentUser) {
        // Try to find as lender first
        LendRequest lend = lendRequestRepository.findByIdAndLender(lendId, currentUser)
                .orElse(null);
        
        // If not found as lender, try as borrower
        if (lend == null) {
            lend = lendRequestRepository.findByIdAndBorrower_LinkedUser(lendId, currentUser)
                    .orElseThrow(() -> new RuntimeException("Lend #" + lendId + " not found or access denied"));
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (Document doc = new Document(new PdfDocument(new PdfWriter(baos)))) {

            // Title with primary color
            doc.add(new Paragraph("Salaf — Payment Receipt")
                    .setBold()
                    .setFontSize(22)
                    .setFontColor(PRIMARY_COLOR)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(6));

            doc.add(new Paragraph("Generated: " + java.time.LocalDateTime.now().format(DATETIME_FMT))
                    .setFontSize(9)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            // Detail table with enhanced styling
            Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                    .useAllAvailableWidth();

            // Header row with dark background
            addStyledRow(table, "Receipt No.", "RCP-" + String.format("%05d", lend.getId()), DARK_HEADER, TEXT_LIGHT, true);
            
            // Party information with light background
            addStyledRow(table, "Lender", lend.getLender().getName(), LIGHT_HEADER, TEXT_DARK, false);
            addStyledRow(table, "Borrower", lend.getBorrower().getName(), LIGHT_HEADER, TEXT_DARK, false);
            
            // Financial information
            addStyledRow(table, "Original Amount", "BD " + lend.getAmount().toPlainString(), LIGHT_HEADER, TEXT_DARK, false);
            
            // Amount paid in green
            java.math.BigDecimal amountPaid = lend.getAmount().subtract(lend.getRemainingBalance());
            addStyledRow(table, "Amount Paid", "BD " + amountPaid.toPlainString(), LIGHT_HEADER, SUCCESS_COLOR, false);
            
            // Remaining balance - red if > 0, green if 0
            Color balanceColor = lend.getRemainingBalance().compareTo(java.math.BigDecimal.ZERO) > 0 ? DANGER_COLOR : SUCCESS_COLOR;
            addStyledRow(table, "Remaining Balance", "BD " + lend.getRemainingBalance().toPlainString(), LIGHT_HEADER, balanceColor, false);
            
            addStyledRow(table, "Due Date", lend.getDueDate().format(DATE_FMT), LIGHT_HEADER, TEXT_DARK, false);
            
            // Status with appropriate color
            Color statusColor = getStatusColor(lend.getStatus().name());
            addStyledRow(table, "Status", lend.getStatus().name(), LIGHT_HEADER, statusColor, false);
            
            addStyledRow(table, "Created", lend.getCreatedAt().format(DATETIME_FMT), LIGHT_HEADER, TEXT_DARK, false);

            if (lend.getNote() != null && !lend.getNote().isBlank()) {
                addStyledRow(table, "Note", lend.getNote(), SECONDARY_COLOR, TEXT_LIGHT, false);
            }

            doc.add(table);

            // Acknowledgment section with success color
            if (lend.getStatus().name().equals("ACCEPTED") || 
                lend.getStatus().name().equals("PARTIALLY_PAID") || 
                lend.getStatus().name().equals("PAID")) {
                doc.add(new Paragraph("\nAcknowledged by " + lend.getBorrower().getName())
                        .setFontSize(12)
                        .setFontColor(SUCCESS_COLOR)
                        .setBold()
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginTop(20));
            }

            // Footer
            doc.add(new Paragraph("Generated by Salaf")
                    .setFontSize(10)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30));
        }

        return baos.toByteArray();
    }

    // Helper method to add styled rows to table
    private void addStyledRow(Table table, String label, String value, Color backgroundColor, Color textColor, boolean isHeader) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setBold().setFontColor(textColor))
                .setBackgroundColor(backgroundColor)
                .setPadding(8);
        
        Cell valueCell = new Cell()
                .add(new Paragraph(value).setFontColor(textColor))
                .setBackgroundColor(backgroundColor)
                .setPadding(8);
        
        if (isHeader) {
            labelCell.setBold();
            valueCell.setBold();
        }
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    // Helper method to get appropriate color for status
    private Color getStatusColor(String status) {
        switch (status.toUpperCase()) {
            case "PAID":
                return SUCCESS_COLOR;
            case "OVERDUE":
                return DANGER_COLOR;
            case "PARTIALLY_PAID":
            case "ACCEPTED":
            case "ACTIVE":
                return WARNING_COLOR;
            case "PENDING":
            case "BORROW_REQUESTED":
                return SECONDARY_COLOR;
            case "REJECTED":
                return DANGER_COLOR;
            default:
                return TEXT_DARK;
        }
    }

    // Legacy method for backward compatibility
    private void addRow(Table table, String label, String value) {
        addStyledRow(table, label, value, LIGHT_HEADER, TEXT_DARK, false);
    }
}
