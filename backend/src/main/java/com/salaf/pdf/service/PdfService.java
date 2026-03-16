package com.salaf.pdf.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Div;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.BorderRadius;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.salaf.auth.entity.User;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.repository.LendRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final LendRequestRepository lendRequestRepository;

    private static final DateTimeFormatter DATE_FMT     = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");

    // ── Brand colors matching the mobile app ──────────────────────────────────
    private static final Color C_PRIMARY = new DeviceRgb(0xFF, 0xB5, 0x00); // #FFB500 amber
    private static final Color C_TEXT    = new DeviceRgb(0x12, 0x12, 0x12); // #121212
    private static final Color C_GRAY    = new DeviceRgb(0x9C, 0xA3, 0xAF); // #9CA3AF
    private static final Color C_BORDER  = new DeviceRgb(0xEF, 0xEF, 0xEF); // #EFEFEF
    private static final Color C_SUCCESS = new DeviceRgb(0x22, 0xC5, 0x5E); // #22C55E
    private static final Color C_DANGER  = new DeviceRgb(0xEF, 0x44, 0x44); // #EF4444
    private static final Color C_WARNING = new DeviceRgb(0xFB, 0x92, 0x3C); // #FB923C
    private static final Color C_BLUE    = new DeviceRgb(0x3B, 0x82, 0xF6); // #3B82F6

    // ── Public entry points ───────────────────────────────────────────────────

    public byte[] generateLendReceipt(Long lendId, User user) {
        LendRequest lend = lendRequestRepository.findByIdAndLender(lendId, user)
                .orElseThrow(() -> new RuntimeException("Lend #" + lendId + " not found"));
        return buildReceiptPdf(lend);
    }

    public byte[] generateReceiptPdf(Long lendId, User currentUser) {
        LendRequest lend = lendRequestRepository.findByIdAndLender(lendId, currentUser)
                .orElse(null);
        if (lend == null) {
            lend = lendRequestRepository.findByIdAndBorrower_LinkedUser(lendId, currentUser)
                    .orElseThrow(() -> new RuntimeException("Lend #" + lendId + " not found or access denied"));
        }
        return buildReceiptPdf(lend);
    }

    // ── Core PDF builder ──────────────────────────────────────────────────────

    private byte[] buildReceiptPdf(LendRequest lend) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (Document doc = new Document(new PdfDocument(new PdfWriter(baos)))) {
            // Body margins — header will bleed to edge with negative margins
            doc.setMargins(0, 36, 36, 36);

            // ── Amber header banner ───────────────────────────────────────────
            Div header = new Div()
                    .setBackgroundColor(C_PRIMARY)
                    .setPaddingTop(32).setPaddingBottom(24)
                    .setPaddingLeft(36).setPaddingRight(36)
                    .setMarginLeft(-36).setMarginRight(-36)
                    .setMarginBottom(28);

            // Logo image (falls back to text if not found)
            try (InputStream is = getClass().getResourceAsStream("/logo.png")) {
                if (is != null) {
                    Image logo = new Image(ImageDataFactory.create(is.readAllBytes()));
                    logo.setHeight(38);
                    logo.setHorizontalAlignment(HorizontalAlignment.CENTER);
                    header.add(logo);
                } else {
                    header.add(logoFallbackText());
                }
            } catch (IOException e) {
                header.add(logoFallbackText());
            }

            header.add(new Paragraph("Payment Receipt")
                    .setBold().setFontSize(16).setFontColor(ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(8).setMarginBottom(16));

            // Receipt No + Date on same row
            Table meta = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                    .useAllAvailableWidth().setBorder(Border.NO_BORDER);
            meta.addCell(headerCell(
                    new Paragraph("Receipt No.: RCP-" + String.format("%05d", lend.getId()))
                            .setBold().setFontSize(12).setFontColor(ColorConstants.WHITE)));
            meta.addCell(headerCell(
                    new Paragraph("Date: " + LocalDateTime.now().format(DATE_FMT))
                            .setBold().setFontSize(12).setFontColor(ColorConstants.WHITE)
                            .setTextAlignment(TextAlignment.RIGHT)));
            header.add(meta);

            doc.add(header);

            // ── Parties ───────────────────────────────────────────────────────
            doc.add(sectionLabel("PARTIES"));

            String borrowerEmail = lend.getBorrower().getLinkedUser() != null
                    ? lend.getBorrower().getLinkedUser().getEmail() : "";

            Table parties = dataTable();
            addPartyRow(parties, "Lender",   lend.getLender().getName(),   lend.getLender().getEmail());
            addPartyRow(parties, "Borrower", lend.getBorrower().getName(), borrowerEmail);
            doc.add(parties);

            // ── Payment details ───────────────────────────────────────────────
            doc.add(sectionLabel("PAYMENT DETAILS"));

            BigDecimal amountPaid  = lend.getAmount().subtract(lend.getRemainingBalance());
            Color      balanceColor = lend.getRemainingBalance().compareTo(BigDecimal.ZERO) > 0
                    ? C_DANGER : C_SUCCESS;

            Table details = dataTable();
            addDataRow(details, "Original Amount",  "BD " + lend.getAmount().toPlainString(),            C_TEXT);
            addDataRow(details, "Amount Paid",      "BD " + amountPaid.toPlainString(),                 C_SUCCESS);
            addDataRow(details, "Remaining Balance","BD " + lend.getRemainingBalance().toPlainString(),  balanceColor);
            addDataRow(details, "Due Date",          lend.getDueDate().format(DATE_FMT),                C_TEXT);
            addDataRow(details, "Created",           lend.getCreatedAt().format(DATETIME_FMT),          C_TEXT);
            doc.add(details);

            // Status badge
            doc.add(statusBadge(lend.getStatus().name()));

            // Note
            if (lend.getNote() != null && !lend.getNote().isBlank()) {
                doc.add(sectionLabel("NOTE"));
                doc.add(new Paragraph(lend.getNote())
                        .setFontSize(11).setFontColor(C_TEXT).setMarginBottom(16));
            }

            // ── Acknowledgment ────────────────────────────────────────────────
            String status = lend.getStatus().name();
            if (status.equals("ACCEPTED") || status.equals("PARTIALLY_PAID") || status.equals("PAID")) {
                Div ack = new Div()
                        .setBackgroundColor(new DeviceRgb(0xF0, 0xFD, 0xF4))
                        .setBorder(new SolidBorder(C_SUCCESS, 1))
                        .setBorderRadius(new BorderRadius(8))
                        .setPadding(12)
                        .setMarginTop(24).setMarginBottom(8);
                ack.add(new Paragraph("Acknowledged by " + lend.getBorrower().getName())
                        .setBold().setFontSize(12).setFontColor(C_SUCCESS)
                        .setTextAlignment(TextAlignment.CENTER).setMarginBottom(2));
                ack.add(new Paragraph(lend.getCreatedAt().format(DATE_FMT))
                        .setFontSize(10).setFontColor(C_SUCCESS)
                        .setTextAlignment(TextAlignment.CENTER));
                doc.add(ack);
            }

            // ── Footer ────────────────────────────────────────────────────────
            doc.add(new Paragraph("Generated by Salaf")
                    .setFontSize(9).setFontColor(C_GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(24));
        }

        return baos.toByteArray();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Paragraph logoFallbackText() {
        return new Paragraph("Salaf")
                .setBold().setFontSize(28).setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(4);
    }

    private Cell headerCell(Paragraph p) {
        return new Cell().add(p).setBorder(Border.NO_BORDER)
                .setBackgroundColor(C_PRIMARY).setPadding(0);
    }

    private Paragraph sectionLabel(String text) {
        return new Paragraph(text)
                .setBold().setFontSize(9).setFontColor(C_GRAY)
                .setMarginTop(20).setMarginBottom(4);
    }

    private Table dataTable() {
        return new Table(UnitValue.createPercentArray(new float[]{42, 58}))
                .useAllAvailableWidth().setBorder(Border.NO_BORDER);
    }

    private void addDataRow(Table table, String label, String value, Color valueColor) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setFontSize(11).setFontColor(C_GRAY))
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(C_BORDER, 0.5f))
                .setPaddingTop(9).setPaddingBottom(9).setPaddingLeft(0).setPaddingRight(0));
        table.addCell(new Cell()
                .add(new Paragraph(value).setFontSize(11).setFontColor(valueColor).setBold())
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(C_BORDER, 0.5f))
                .setPaddingTop(9).setPaddingBottom(9).setPaddingLeft(0).setPaddingRight(0)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private void addPartyRow(Table table, String label, String name, String email) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setFontSize(11).setFontColor(C_GRAY))
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(C_BORDER, 0.5f))
                .setPaddingTop(9).setPaddingBottom(9).setPaddingLeft(0).setPaddingRight(0));

        Div nameBlock = new Div();
        nameBlock.add(new Paragraph(name).setBold().setFontSize(11).setFontColor(C_TEXT).setMarginBottom(0));
        if (!email.isBlank()) {
            nameBlock.add(new Paragraph(email).setFontSize(9).setFontColor(C_GRAY).setMarginTop(2));
        }
        table.addCell(new Cell()
                .add(nameBlock)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(C_BORDER, 0.5f))
                .setPaddingTop(9).setPaddingBottom(9).setPaddingLeft(0).setPaddingRight(0)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private Div statusBadge(String status) {
        Div badge = new Div()
                .setBackgroundColor(getStatusBgColor(status))
                .setBorderRadius(new BorderRadius(20))
                .setPaddingTop(5).setPaddingBottom(5)
                .setPaddingLeft(14).setPaddingRight(14)
                .setMarginTop(12).setMarginBottom(4)
                .setHorizontalAlignment(HorizontalAlignment.LEFT);
        badge.add(new Paragraph(status)
                .setFontSize(10).setFontColor(getStatusColor(status)).setBold());
        return badge;
    }

    private Color getStatusColor(String status) {
        switch (status.toUpperCase()) {
            case "PAID":                              return C_SUCCESS;
            case "OVERDUE": case "REJECTED":          return C_DANGER;
            case "PARTIALLY_PAID": case "ACCEPTED":
            case "ACTIVE":                            return C_WARNING;
            case "PENDING": case "BORROW_REQUESTED":  return C_BLUE;
            default:                                  return C_TEXT;
        }
    }

    private Color getStatusBgColor(String status) {
        switch (status.toUpperCase()) {
            case "PAID":                              return new DeviceRgb(0xF0, 0xFD, 0xF4);
            case "OVERDUE": case "REJECTED":          return new DeviceRgb(0xFE, 0xF2, 0xF2);
            case "PARTIALLY_PAID": case "ACCEPTED":
            case "ACTIVE":                            return new DeviceRgb(0xFF, 0xF7, 0xED);
            case "PENDING": case "BORROW_REQUESTED":  return new DeviceRgb(0xEF, 0xF6, 0xFF);
            default:                                  return new DeviceRgb(0xF5, 0xF5, 0xF5);
        }
    }
}
