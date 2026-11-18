import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { LUT_CLAUSE, amountInWords, fmtDate } from "@/lib/utils";
const s = StyleSheet.create({
    page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
    banner: { borderWidth: 1, borderColor: "#111", padding: 6, alignItems: "center" },
    title: { fontSize: 15, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
    lut: { fontSize: 8, marginTop: 3, textAlign: "center" },
    row: { flexDirection: "row" },
    box: { borderWidth: 1, borderColor: "#111", padding: 6, marginTop: -1 },
    half: { flex: 1 },
    h: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 3 },
    b: { fontFamily: "Helvetica-Bold" },
    line: { marginBottom: 2, lineHeight: 1.3 },
    th: { fontFamily: "Helvetica-Bold", fontSize: 8, padding: 3, borderRightWidth: 1, borderColor: "#111", textAlign: "center", justifyContent: "center" },
    td: { padding: 3, borderRightWidth: 1, borderColor: "#111", fontSize: 9 },
    tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#111" },
    table: { borderWidth: 1, borderColor: "#111", marginTop: -1 },
    sig: { height: 48, objectFit: "contain", alignSelf: "flex-end", marginVertical: 4 },
});
const COLS = { sno: 28, desc: 199, sac: 50, total: 55, taxable: 55, tax: 52 };
const money = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function Cell({ w, children, style, last }) {
    return <View style={[{ width: w }, last ? { borderRightWidth: 0 } : {}, ...(Array.isArray(style) ? style : [style ?? {}])]}>{children}</View>;
}
function InvoicePage({ d, signature }) {
    const sp = d.supplier, r = d.receiver;
    const supplierAddr = [sp.addressLine1, sp.addressLine2, `${sp.city}, ${sp.state}`, `PIN: ${sp.pincode}`].filter(Boolean);
    const receiverAddr = [r.addressLine1, r.addressLine2, [r.city, r.postalCode].filter(Boolean).join(" ")].filter(Boolean);
    const rows = [];
    d.lines.forEach((l) => {
        if (l.amountUsd != null || rows.length === 0)
            rows.push({ descs: [l.description], sac: l.sacCode, amount: l.amountUsd ?? d.subtotalUsd });
        else
            rows[rows.length - 1].descs.push(l.description);
    });
    const terms = [
        `Subject to jurisdiction of courts at ${sp.jurisdictionCity}.`,
        d.customTerms ?? "",
    ].filter(Boolean);
    return (<Page size="A4" style={s.page}>
      <View style={s.banner}>
        <Text style={s.title}>INVOICE / TAX INVOICE</Text>
        <Text style={s.lut}>{LUT_CLAUSE}</Text>
      </View>

      <View style={[s.row, { marginTop: -1 }]}>
        <View style={[s.box, s.half, { marginTop: 0 }]}>
          <Text style={s.h}>Details of Supplier</Text>
          <Text style={[s.line, s.b]}>{sp.fullName}</Text>
          {sp.tradeName ? <Text style={s.line}>({sp.tradeName})</Text> : null}
          {supplierAddr.map((a, i) => <Text key={i} style={s.line}>{a}</Text>)}
          <Text style={[s.line, s.b]}>GSTIN: {sp.gstin}</Text>
          <Text style={s.line}>PAN: {sp.pan}</Text>
        </View>
        <View style={[s.box, s.half, { marginLeft: -1, marginTop: 0 }]}>
          <Text style={s.line}><Text style={s.b}>Serial No. of Invoice: </Text>{d.invoiceNumber}</Text>
          <Text style={s.line}><Text style={s.b}>Invoice Date: </Text>{fmtDate(d.invoiceDate)}</Text>
          <Text style={s.line}><Text style={s.b}>Place of Supply: </Text>{d.placeOfSupply}</Text>
          <Text style={s.line}><Text style={s.b}>Country of Supply: </Text>{d.countryOfSupply}</Text>
          <Text style={s.line}><Text style={s.b}>Amount of Tax Subject to Reverse Charges: </Text>No / Nil</Text>
        </View>
      </View>

      <View style={s.box}>
        <Text style={s.h}>Details of Receiver (Billed To)</Text>
        <Text style={s.line}><Text style={s.b}>Name: </Text>{r.companyName}</Text>
        <Text style={s.line}><Text style={s.b}>Address: </Text>{receiverAddr.join(", ")}</Text>
        <View style={s.row}>
          <Text style={[s.line, { width: "34%" }]}><Text style={s.b}>State / Province: </Text>{r.stateProvince ?? "—"}</Text>
          <Text style={[s.line, { width: "26%" }]}><Text style={s.b}>State Code: </Text>{r.stateCode ?? "—"}</Text>
          <Text style={[s.line, { width: "40%" }]}><Text style={s.b}>Country: </Text>{r.country}</Text>
        </View>
        <Text style={s.line}><Text style={s.b}>GSTIN / Unique ID: </Text>{r.taxIdOrGstin || "Not Applicable (Foreign Recipient)"}</Text>
      </View>

      <View style={s.table}>
        <View style={s.tr}>
          <Cell w={COLS.sno} style={s.th}><Text>S.No</Text></Cell>
          <Cell w={COLS.desc} style={s.th}><Text>Description of Services</Text></Cell>
          <Cell w={COLS.sac} style={s.th}><Text>SAC Code</Text></Cell>
          <Cell w={COLS.total} style={s.th}><Text>Total ({d.currency})</Text></Cell>
          <Cell w={COLS.taxable} style={s.th}><Text>Taxable Value</Text></Cell>
          <Cell w={COLS.tax} style={s.th}><Text>CGST{"\n"}Rate / Amt</Text></Cell>
          <Cell w={COLS.tax} style={s.th}><Text>SGST{"\n"}Rate / Amt</Text></Cell>
          <Cell w={COLS.tax} style={[s.th, { borderRightWidth: 0 }]}><Text>IGST{"\n"}Rate / Amt</Text></Cell>
        </View>
        {rows.map((row, i) => (<View key={i} style={[s.tr, { minHeight: 70 }]}>
            <Cell w={COLS.sno} style={[s.td, { textAlign: "center" }]}><Text>{i + 1}</Text></Cell>
            <Cell w={COLS.desc} style={s.td}>{row.descs.map((t, j) => <Text key={j} style={s.line}>{t}</Text>)}</Cell>
            <Cell w={COLS.sac} style={[s.td, { textAlign: "center" }]}><Text>{row.sac}</Text></Cell>
            <Cell w={COLS.total} style={[s.td, { textAlign: "right" }]}><Text>{money(row.amount)}</Text></Cell>
            <Cell w={COLS.taxable} style={[s.td, { textAlign: "right" }]}><Text>{money(row.amount)}</Text></Cell>
            {[0, 1, 2].map((k) => (<Cell key={k} w={COLS.tax} last={k === 2} style={[s.td, { textAlign: "center" }]}><Text>0.00% / 0.00</Text></Cell>))}
          </View>))}
        <View style={s.tr}>
          <Cell w={COLS.sno + COLS.desc + COLS.sac} style={[s.td, s.b, { textAlign: "right" }]}><Text>Total Taxable Value</Text></Cell>
          <Cell w={COLS.total} style={[s.td, s.b, { textAlign: "right" }]}><Text>{money(d.subtotalUsd)}</Text></Cell>
          <Cell w={COLS.taxable} style={[s.td, s.b, { textAlign: "right" }]}><Text>{money(d.subtotalUsd)}</Text></Cell>
          {[0, 1, 2].map((k) => (<Cell key={k} w={COLS.tax} last={k === 2} style={[s.td, { textAlign: "center" }]}><Text>0.00</Text></Cell>))}
        </View>
        <View style={[s.tr, { borderBottomWidth: 0 }]}>
          <Cell w={COLS.sno + COLS.desc + COLS.sac + COLS.total + COLS.taxable + COLS.tax * 3} last style={s.td}>
            <Text style={[s.b, { fontSize: 11 }]}>Invoice Total: {d.currency} {money(d.totalUsd)}</Text>
            <Text style={{ marginTop: 2 }}>Amount in Words: {amountInWords(d.totalUsd, d.currency)}</Text>
          </Cell>
        </View>
      </View>

      <View style={[s.row, { marginTop: -1 }]}>
        <View style={[s.box, { width: "62%", marginTop: 0 }]}>
          <Text style={s.line}>
            Certified that the particulars given above are true and correct and the amount indicated represents the price
            actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.
          </Text>
          <Text style={[s.h, { marginTop: 6 }]}>TERMS OF SALE</Text>
          {terms.map((t, i) => <Text key={i} style={s.line}>{i + 1}. {t}</Text>)}
          <Text style={[s.line, { fontSize: 8, marginTop: 4 }]}>{d.lutDeclarationText}</Text>
        </View>
        <View style={[s.box, { width: "38%", marginLeft: -1, marginTop: 0, justifyContent: "space-between" }]}>
          <View>
            <Text style={[s.b, { textAlign: "right" }]}>For {sp.fullName}</Text>
            <Text style={{ textAlign: "right" }}>GSTIN: {sp.gstin}</Text>
          </View>
          {signature ? <Image src={signature} style={s.sig}/> : <View style={{ height: 52 }}/>}
          <Text style={[s.b, { textAlign: "right" }]}>Authorised Signatory</Text>
        </View>
      </View>
    </Page>);
}
function Section({ title, rows }) {
    return (<View style={{ borderWidth: 1, borderColor: "#111", marginBottom: 14 }} wrap={false}>
      <View style={{ backgroundColor: "#e8e8ee", padding: 6, borderBottomWidth: 1, borderColor: "#111" }}>
        <Text style={s.b}>{title}</Text>
      </View>
      {rows.filter(([, v]) => v).map(([k, v], i) => (<View key={i} style={[s.row, { borderBottomWidth: 0.5, borderColor: "#999", padding: 6 }]}>
          <Text style={{ width: "34%", fontFamily: "Helvetica-Bold" }}>{k}</Text>
          <Text style={{ width: "66%" }}>{v}</Text>
        </View>))}
    </View>);
}
function BankPage({ d, bankImage }) {
    const b = d.bank;
    return (<Page size="A4" style={[s.page, { padding: 40 }]}>
      <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "center" }}>
        INSTRUCTIONS FOR WIRE TRANSFER / TELEGRAPHIC TRANSFER OF PAYMENTS (USD)
      </Text>
      <Text style={{ textAlign: "center", marginTop: 4, marginBottom: 16, fontSize: 9 }}>
        (Bank charges for processing wire transfer to be paid by the remitter)
      </Text>
      {bankImage ? (<Image src={bankImage} style={{ width: "100%", objectFit: "contain" }}/>) : b ? (<>
          <Section title="1. Intermediary / Correspondent / Nostro Bank" rows={[
                ["Bank Name", b.intermediaryBankName], ["SWIFT Code", b.intermediarySwift], ["CHIPS UID", b.chipsUid],
                ["FED ABA Routing Number", b.fedAbaRouting], ["Nostro Account Number", b.nostroAccountNumber],
            ]}/>
          <Section title="2. Beneficiary Bank (Receiving Bank in India)" rows={[
                ["Bank Name", b.beneficiaryBankName], ["Branch Address", b.beneficiaryBranchAddress],
                ["SWIFT Code", b.beneficiarySwift], ["IFSC", b.beneficiaryIfsc],
            ]}/>
          <Section title="3. Final Beneficiary Details (Recipient)" rows={[
                ["Account Holder Name", b.accountHolderName], ["Account Number", b.accountNumber],
                ["Account Holder Address", b.accountHolderAddress],
                ["Purpose of Remittance", `${b.purposeCode} - ${b.purposeDescription}`],
            ]}/>
          <Text style={{ fontSize: 8, marginTop: 6 }}>Invoice Ref: {d.invoiceNumber} | Amount: {d.currency} {money(d.totalUsd)}</Text>
        </>) : (<Text>Bank details have not been configured for this freelancer.</Text>)}
    </Page>);
}
/** Pass `skipBankPage` when an uploaded PDF will be merged in as Page 2 via pdf-lib. */
export function InvoiceDocument(props) {
    return (<Document title={`Invoice ${props.data.invoiceNumber}`} author={props.data.supplier.fullName}>
      <InvoicePage d={props.data} signature={props.signature}/>
      {props.skipBankPage ? null : <BankPage d={props.data} bankImage={props.bankImage}/>}
    </Document>);
}
