// js/ui/output-generators.js
import { $, notify } from './dom.js'; // FIX: Import notify
import { getFormData } from './form-handler.js';

export function sendEmail(emailType) {
    const customerName = $('name').value.trim();
    const customerEmail = $('email').value.trim();
    const tsNumber = $('tsNumber').value.trim() || $('tsNumber-main').value.trim();

    if (!customerName || !customerEmail) {
        notify("❌ Please enter the customer's name and email address in the form.");
        return;
    }

    let subject = "";
    let body = "";

    switch(emailType) {
        case 'quote':
            subject = `Your Requested Quote from Hamburg Overhead Door - TS #${tsNumber || 'N/A'}`;
            body = `Dear ${customerName},\n\nThank you for reaching out to Hamburg Overhead Door...`;
            break;
        case 'invoice':
            subject = `Your Invoice from Hamburg Overhead Door - TS #${tsNumber || 'N/A'}`;
            body = `Dear ${customerName},\n\nThank you for choosing Hamburg Overhead Door...`;
            break;
        case 'depositReceipt':
            subject = `Deposit Receipt and Copy of Work Order Reflecting Deposit - TS #${tsNumber || 'N/A'}`;
            body = `Dear ${customerName},\n\nWe have received your deposit...`;
            break;
    }

    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailLink, '_blank');
}

export function generatePaymentPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const grab = id => ($(id)?.value || '').trim();
    const ts = (grab('tsNumber') || ('TS' + Date.now())).replace(/\s+/g, '');
    const fullName = grab('paymentAccountName') || grab('name') || 'NO_NAME';
    const nameParts = fullName.trim().split(/\s+/);
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
    const custLastName = lastName.toUpperCase();
    const now = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' +
                             new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '');
    const filename = `${custLastName}_${ts}_${now}.pdf`;
    const rows = [
        ["Account Name", grab("paymentAccountName")],
        ["Email", grab("email")],
        ["Billing Address", grab("billing")],
        ["Account Number", grab("paymentAccountNumber")],
        ["Expiration Date", grab("paymentExpDate")],
        ["Security Code", grab("paymentSecurityCode")],
        ["Deposit Amount", grab("depositAmount")],
        ["Remaining Balance", grab("remainingBalance")],
        ["Legacy TS Number", grab("tsNumber")],
        ["Billing Changes", grab("billingChanges")],
        ["Receipt Method", grab("receiptMethod")],
        ["Quoted Amount", grab("quotedAmount")]
    ];

    let y = 40;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Payment Information', 40, y);
    y += 20;
    rows.forEach(([label, val]) => {
        doc.text(label + ':', 40, y);
        doc.text(val || '—', 200, y);
        y += 18;
    });
    
    doc.save(filename);
}

export function generateServiceTicketOutput(equipmentData) {
    const data = getFormData(equipmentData);
    let outputParts = [];
    const toUpper = (str) => (str || '').toUpperCase();

    const outputData = {
        jobsite: toUpper(data.jobsite),
        directions: toUpper(data.directions),
        name: toUpper(data.name),
        phone: toUpper(data.phone),
        email: toUpper(data.email),
        availability: toUpper(data.availability),
        request: toUpper(data.request),
        date: toUpper($('current-date').value).replace(/\//g, '-'),
        initials: toUpper(data.initials),
        callType: data.callType,
        installDate: toUpper(data.installDate),
        installer: toUpper(data.installer),
        poType: data.poType,
        poNumber: toUpper(data.poNumberInput),
        verbalPo: toUpper(data.verbalPoInput),
        warrantyTsNumber: toUpper(data.warrantyTsNumber),
        quotedAmount: toUpper(data.quotedAmount)
    };
    
    if (outputData.jobsite) outputParts.push(outputData.jobsite);
    if (outputData.directions) outputParts.push(outputData.directions);
    const contactInfo = [outputData.name, outputData.phone, outputData.email].filter(Boolean).join(', ');
    if (contactInfo) outputParts.push(contactInfo);
    if (outputData.availability) outputParts.push(outputData.availability);
    
    if (data.equipment && data.equipment.length > 0) {
        const allDoorsInfo = data.equipment.map((door, index) => {
            const doorPart = door.door ? `DOOR ${index + 1}: ${door.door}` : '';
            const operatorPart = door.operator ? `OPERATOR: ${door.operator}` : '';
            return [doorPart, operatorPart].filter(Boolean).join(' ');
        }).filter(Boolean).join(' | ');
        if (allDoorsInfo) outputParts.push(toUpper(allDoorsInfo));
    }

    if (outputData.request) outputParts.push(outputData.request);
    outputParts.push(`TAKEN: ${outputData.date} ${outputData.initials}`);
    if (outputData.quotedAmount) outputParts.push(`QUOTED: ${outputData.quotedAmount}`);
    
    let paymentInfo = '';
    switch (outputData.poType) {
        case 'PO Number': if (outputData.poNumber) paymentInfo = `PO #: ${outputData.poNumber}`; break;
        case 'Verbal PO': if (outputData.verbalPo) paymentInfo = `VERBAL PO: ${outputData.verbalPo}`; break;
        case 'CC on File': paymentInfo = 'CC ON FILE'; break;
        case 'COD': paymentInfo = 'COD'; break;
        case 'Warranty':
            let warrantyDetails = [
                outputData.installer ? `INSTALLER: ${outputData.installer}` : '',
                outputData.installDate ? `INSTALL DATE: ${outputData.installDate}` : '',
                outputData.warrantyTsNumber ? `ORIGINAL TS #: ${outputData.warrantyTsNumber}` : ''
            ].filter(Boolean);
            paymentInfo = `WARRANTY${warrantyDetails.length > 0 ? ` (${warrantyDetails.join(', ')})` : ''}`;
            break;
    }
    if (paymentInfo) outputParts.push(paymentInfo);
    outputParts.push('PLEASE CALL EN ROUTE');
    
    const out = outputParts.join('\n');
    $('output').value = out;
    $('output').style.display = 'block';
    navigator.clipboard.writeText(out).then(() => notify('📋 Service Ticket Output copied to clipboard!'));
}

export function generateQuoteOutput(equipmentData) {
    const data = getFormData(equipmentData);
    let outputParts = [];
    const toUpper = (str) => (str || '').toUpperCase();

    if (data.jobsite) outputParts.push(toUpper(data.jobsite));
    if (data.directions) outputParts.push(toUpper(data.directions));

    const contactName = toUpper(data.name);
    const contactPhone = toUpper(data.phone);
    const contactEmail = toUpper(data.email);
    let contactLine = [contactName, contactPhone].filter(Boolean).join(' ');
    if (contactEmail) contactLine += `; ${contactEmail}`;
    
    if (contactLine) outputParts.push(contactLine);
    if (data.siteSpecs) outputParts.push(`SITE SPECS: ${toUpper(data.siteSpecs)}`);
    if (data.wePropose) outputParts.push(`WE PROPOSE: ${toUpper(data.wePropose)}`);
    
    outputParts.push("50% DEPOSIT REQUIRED TO PROCEED");

    if (data.leadTime) outputParts.push(`LEAD TIME: ${toUpper(data.leadTime)}`);

    const out = outputParts.join('\n');
    $('output').value = out;
    $('output').style.display = 'block';
    navigator.clipboard.writeText(out).then(() => notify('📋 Quote Output copied to clipboard!'));
}

export function printRecord(equipmentData) {
    const data = getFormData(equipmentData);
    
    const sanitize = (str) => {
        const temp = document.createElement('div');
        temp.textContent = str || '';
        return temp.innerHTML;
    };
    
    const customerName = data.name || '';
    const nameInitials = sanitize(customerName.substring(0, 3).toUpperCase());
    const docId = sanitize(data.docId || '');
    
    const fieldLabels = { 'siteSpecs': 'Site Specs', 'initials': 'CSR Initials', 'billing': 'Billing Address', 'jobsite': 'Jobsite Address', 'name': 'Name', 'phone': 'Phone', 'email': 'Email', 'availability': 'Availability', 'request': 'Work Requested', 'notes': 'Notes', 'paymentAccountName': 'Account Name', 'paymentAccountNumber': 'Account Number', 'paymentExpDate': 'Exp Date', 'paymentSecurityCode': 'Security Code', 'billingChanges': 'Billing Address Changes', 'depositAmount': 'Deposit Amount', 'remainingBalance': 'Remaining Balance', 'tsNumber': 'Legacy TS Number', 'receiptMethod': 'Receipt Method', 'directions': 'Directions', 'installDate': 'Install Date', 'installer': 'Installer', 'callType': 'Call Type', 'warrantyTsNumber': 'Original TS Number', 'quotedAmount': 'Quoted Amount', 'wePropose': 'We Propose', 'leadTime': 'Lead Time' };
    const equipmentLabels = { 'door': 'Door Info', 'operator': 'Operator Info', 'floorCeiling': 'Floor to Ceiling', 'floorObstruction': 'Floor to Lowest Obstruction', 'construction': 'Construction Type', 'backroom': 'Backroom', 'sideroom': 'Sideroom', 'headroom': 'Headroom', 'power': 'Power', 'color': 'Color', 'jambs': 'Jambs', 'floor': 'Floor', 'doorSize': 'Door Size', 'opening': 'Opening Size', 'corner': 'Corner Type', 'track': 'Track Radius', 'spring': 'Spring Info', 'weatherstop': 'Weatherstop Color' };

    let printHtml = `
        <style>
            body { font-family: sans-serif; margin: 2rem; }
            .print-main-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .print-main-header h1 { font-size: 1.8rem; margin: 0; text-align: left; }
            .print-header-info { text-align: right; flex-shrink: 0; }
            .file-initials { font-size: 48px; font-weight: bold; color: #cccccc; line-height: 1; }
            .print-doc-id { font-size: 0.8rem; color: #999999; font-family: monospace; margin-top: 0.25rem; }
            .section { margin-bottom: 1.5rem; border-bottom: 1px solid #ccc; padding-bottom: 1rem; page-break-inside: avoid; }
            .section:last-of-type { border-bottom: none; }
            .section h2 { font-size: 1.2rem; border-bottom: 2px solid #333; padding-bottom: 0.3rem; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .item { margin-bottom: 0.5rem; }
            .item strong { display: block; color: #555; font-size: 0.9rem; }
            .full-width { grid-column: 1 / -1; }
            div { white-space: pre-wrap; word-break: break-word; }
        </style>
        <div class="print-main-header">
            <h1>Job Intake Record</h1>
            <div class="print-header-info">
                <div class="file-initials">${nameInitials}</div>
                <div class="print-doc-id">${docId}</div>
            </div>
        </div>
    `;

    const createSection = (title, fields, sourceData) => {
        let content = '';
        fields.forEach(id => {
            if (sourceData[id]) {
                const isTextArea = ['billing', 'jobsite', 'request', 'notes', 'door', 'operator', 'spring', 'directions', 'wePropose', 'siteSpecs'].includes(id);
                const colClass = isTextArea ? 'full-width' : '';
                content += `<div class="item ${colClass}"><strong>${fieldLabels[id] || id}:</strong> <div>${sanitize(sourceData[id])}</div></div>`;
            }
        });
        if (content) {
            return `<div class="section"><h2>${title}</h2><div class="grid">${content}</div></div>`;
        }
        return '';
    };
    
    printHtml += createSection('Job & Contact Info', ['callType', 'initials', 'name', 'phone', 'email', 'availability', 'billing', 'jobsite', 'directions'], data);
    printHtml += createSection('Work & Notes', ['request', 'notes'], data);
    printHtml += createSection('Site Specs', ['siteSpecs'], data);
    printHtml += createSection('Quote Details', ['wePropose', 'leadTime', 'quotedAmount'], data);
    
    if(data.equipment && data.equipment.length > 0) {
        data.equipment.forEach((door, index) => {
            let doorContent = '';
            Object.keys(equipmentLabels).forEach(id => {
                if (door[id]) {
                    const isTextArea = ['door', 'operator', 'spring'].includes(id);
                    const colClass = isTextArea ? 'full-width' : '';
                    doorContent += `<div class="item ${colClass}"><strong>${equipmentLabels[id]}:</strong> <div>${sanitize(door[id])}</div></div>`;
                }
            });
            if(doorContent) {
                printHtml += `<div class="section"><h2>Equipment: Door ${index + 1}</h2><div class="grid">${doorContent}</div></div>`
            }
        });
    }
    
    printHtml += createSection('Warranty', ['installDate', 'installer', 'warrantyTsNumber'], data);
    printHtml += createSection('Payment Details', ['paymentAccountName', 'paymentAccountNumber', 'paymentExpDate', 'paymentSecurityCode', 'depositAmount', 'remainingBalance', 'tsNumber', 'receiptMethod'], data);

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
    printFrame.contentDocument.write(printHtml);
    printFrame.contentDocument.close();
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    setTimeout(() => { document.body.removeChild(printFrame); }, 1000);
}
