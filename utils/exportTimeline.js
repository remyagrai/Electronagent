import jsPDF from 'jspdf';

export function exportTimelinePDF(timelineData) {
  const doc = new jsPDF();
  doc.text('User Timeline', 10, 10);

  timelineData.forEach((item, idx) => {
    doc.text(`${idx+1}. ${item.name || item.domain} | Start: ${new Date(item.startTime).toLocaleTimeString()} | End: ${new Date(item.endTime).toLocaleTimeString()}`, 10, 20 + idx*10);
  });

  doc.save('timeline.pdf');
}
