package com.salaf.pdf.service;

import com.itextpdf.kernel.colors.ColorConstants;
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

    // Task 8 — FR-22, FR-23: generate a lend receipt PDF
    public byte[] generateLendReceipt(Long lendId, User user) {
        LendRequest lend = lendRequestRepository.findByIdAndLender(lendId, user)
                .orElseThrow(() -> new RuntimeException("Lend #" + lendId + " not found"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (Document doc = new Document(new PdfDocument(new PdfWriter(baos)))) {

            // Title
            doc.add(new Paragraph("Salaf — Lend Receipt")
                    .setBold()
                    .setFontSize(22)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(6));

            doc.add(new Paragraph("Generated: " + java.time.LocalDateTime.now().format(DATETIME_FMT))
                    .setFontSize(9)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            // Detail table
            Table table = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
                    .useAllAvailableWidth();

            addRow(table, "Lend ID",    "#" + lend.getId());
            addRow(table, "Lender",     user.getName());
            addRow(table, "Borrower",   lend.getBorrower().getName());
            addRow(table, "Amount",     "BD " + lend.getAmount().toPlainString());
            addRow(table, "Remaining",  "BD " + lend.getRemainingBalance().toPlainString());
            addRow(table, "Due Date",   lend.getDueDate().format(DATE_FMT));
            addRow(table, "Status",     lend.getStatus().name());
            addRow(table, "Created",    lend.getCreatedAt().format(DATETIME_FMT));

            if (lend.getNote() != null && !lend.getNote().isBlank()) {
                addRow(table, "Note", lend.getNote());
            }

            doc.add(table);
        }

        return baos.toByteArray();
    }

    private void addRow(Table table, String label, String value) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setBold())
                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
        table.addCell(new Cell()
                .add(new Paragraph(value)));
    }
}
