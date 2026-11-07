import { formatDate, formatDateTime } from './dates';
import { formatRupiah } from './money';

// "Laporan Buku Uang Kas" (08, PDF report). Built in the browser with jsPDF + autoTable.
// Uses ASCII "-" for minus: the built-in PDF fonts don't have "−".

export type ReportJson = {
	from: string;
	to: string;
	startBalance: number;
	totalIn: number;
	totalOut: number;
	endBalance: number;
	categories: { direction: 'IN' | 'OUT'; label: string; total: number }[];
	rows: {
		date: string;
		direction: 'IN' | 'OUT';
		categoryLabel: string;
		note: string;
		total: number;
		balance: number;
		hasReceipt: boolean;
	}[];
	printedBy: string;
	printedAt: string;
};

const BROWN: [number, number, number] = [124, 66, 0];
const CREAM: [number, number, number] = [255, 246, 223];

const rp = (n: number) => (n < 0 ? `- ${formatRupiah(-n)}` : formatRupiah(n));

export async function downloadReportPdf(r: ReportJson): Promise<void> {
	const [{ jsPDF }, { autoTable }] = await Promise.all([
		import('jspdf'),
		import('jspdf-autotable')
	]);
	const doc = new jsPDF({ format: 'a4', unit: 'mm' });
	const finalY = () =>
		(doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
	const head = { fillColor: CREAM, textColor: BROWN, fontStyle: 'bold' as const };
	const period = `${formatDate(r.from)} - ${formatDate(r.to)}`;

	doc
		.setFont('helvetica', 'bold')
		.setFontSize(16)
		.setTextColor(...BROWN);
	doc.text('Laporan Buku Uang Kas', 14, 18);
	doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(64, 64, 64);
	doc.text('Pembukuan Cold Storage Bebek', 14, 24);
	doc.text(`Periode: ${period}`, 14, 30);
	doc.text(`Dicetak: ${formatDateTime(new Date(r.printedAt))} oleh ${r.printedBy}`, 14, 35);

	autoTable(doc, {
		startY: 41,
		theme: 'grid',
		headStyles: head,
		head: [['Ringkasan', 'Jumlah']],
		body: [
			['Sisa uang di awal periode', rp(r.startBalance)],
			['Total uang masuk', `+ ${formatRupiah(r.totalIn)}`],
			['Total uang keluar', `- ${formatRupiah(r.totalOut)}`],
			['Sisa uang di akhir periode', rp(r.endBalance)]
		],
		columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
	});

	for (const [direction, title] of [
		['IN', 'Uang Masuk per Kelompok'],
		['OUT', 'Uang Keluar per Kelompok']
	] as const) {
		const cats = r.categories.filter((c) => c.direction === direction);
		autoTable(doc, {
			startY: finalY() + 6,
			theme: 'grid',
			headStyles: head,
			head: [[title, 'Total']],
			body: cats.length ? cats.map((c) => [c.label, formatRupiah(c.total)]) : [['Tidak ada', '-']],
			columnStyles: { 1: { halign: 'right' } }
		});
	}

	autoTable(doc, {
		startY: finalY() + 6,
		theme: 'striped',
		headStyles: head,
		styles: { fontSize: 8, cellPadding: 1.5 },
		head: [['Tanggal', 'Kelompok', 'Catatan', 'Masuk', 'Keluar', 'Sisa', 'Nota']],
		body: r.rows.length
			? r.rows.map((x) => [
					formatDate(x.date),
					x.categoryLabel,
					x.note,
					x.direction === 'IN' ? `+ ${formatRupiah(x.total)}` : '',
					x.direction === 'OUT' ? `- ${formatRupiah(x.total)}` : '',
					rp(x.balance),
					x.hasReceipt ? 'Ada' : '-'
				])
			: [['', '', 'Tidak ada catatan di periode ini', '', '', '', '']],
		columnStyles: {
			0: { cellWidth: 20 },
			3: { halign: 'right', textColor: [30, 122, 70] },
			4: { halign: 'right', textColor: [198, 40, 40] },
			5: { halign: 'right' },
			6: { halign: 'center', cellWidth: 11 }
		}
	});

	const pages = doc.getNumberOfPages();
	for (let i = 1; i <= pages; i++) {
		doc.setPage(i).setFontSize(8).setTextColor(120, 120, 120);
		doc.text(`Halaman ${i} dari ${pages}`, 196, 290, { align: 'right' });
	}
	doc.save(`Laporan-Kas-${r.from}-${r.to}.pdf`);
}
