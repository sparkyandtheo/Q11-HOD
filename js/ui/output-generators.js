// js/ui/output-generators.js
import { $, notify } from './dom.js';
import { getFormData } from './form-handler.js'; // Keep getFormData for generating the full data object

/**
 * Sends an email based on the specified type by opening a Gmail compose window.
 * @param {string} emailType - The type of email to send ('quote', 'invoice', 'depositReceipt').
 */
export function sendEmail(emailType) {
    const customerName = $('name').value.trim();
    const customerEmail = $('email').value.trim();
    // Prioritize tsNumber-main for the subject line if available
    const tsNumber = $('tsNumber-main')?.value.trim() || $('tsNumber')?.value.trim() || 'N/A'; 

    if (!customerName || !customerEmail) {
        notify("❌ Please enter the customer's name and email address in the form.");
        return;
    }

    let subject = "";
    let body = "";

    switch(emailType) {
        case 'quote':
            subject = `Your Requested Quote from Hamburg Overhead Door - TS #${tsNumber}`;
            body = `Dear ${customerName},\n\nThank you for reaching out to Hamburg Overhead Door...\n\nSincerely,\nHamburg Overhead Door`;
            break;
        case 'invoice':
            subject = `Your Invoice from Hamburg Overhead Door - TS #${tsNumber}`;
            body = `Dear ${customerName},\n\nThank you for choosing Hamburg Overhead Door. Your invoice is attached/details are below...\n\nSincerely,\nHamburg Overhead Door`;
            break;
        case 'depositReceipt':
            subject = `Deposit Receipt and Copy of Work Order Reflecting Deposit - TS #${tsNumber}`;
            body = `Dear ${customerName},\n\nWe have received your deposit. A receipt and work order copy are attached/details are below...\n\nSincerely,\nHamburg Overhead Door`;
            break;
        default:
            notify("Invalid email type specified.");
            return;
    }

    // Create the Gmail compose link
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailLink, '_blank'); // Open in a new tab
}

/**
 * Generates and downloads a PDF containing payment information.
 */
export function generatePaymentPDF() {
    // Ensure jsPDF library is available
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        notify('❌ PDF generation library (jsPDF) not loaded.');
        console.error('jsPDF library is not available.');
        return;
    }

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    // Helper to safely grab value from DOM element
    const grab = id => ($(id)?.value || '').trim();

    // Generate filename based on TS number and customer last name
    const ts = (grab('tsNumber') || grab('tsNumber-main') || ('TS' + Date.now())).replace(/\s+/g, ''); // Use either tsNumber or tsNumber-main
    const fullName = grab('paymentAccountName') || grab('name') || 'NO_NAME';
    const nameParts = fullName.trim().split(/\s+/);
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
    const custLastName = lastName.toUpperCase();
    
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, ''); // HHMMSS
    const filename = `${custLastName}_${ts}_${dateStr}-${timeStr}.pdf`;

    // Define rows for the PDF table
    const rows = [
        ["Account Name", grab("paymentAccountName")],
        ["Email", grab("email")],
        ["Billing Address", grab("billing")],
        ["Account Number", grab("paymentAccountNumber")],
        ["Expiration Date", grab("paymentExpDate")],
        ["Security Code", grab("paymentSecurityCode")],
        ["Deposit Amount", grab("depositAmount")],
        ["Remaining Balance", grab("remainingBalance")],
        ["Legacy TS Number", grab("tsNumber")], // Still referencing legacy TS number explicitly
        ["Billing Changes", grab("billingChanges")],
        ["Receipt Method", grab("receiptMethod")],
        ["Quoted Amount", grab("quotedAmount")]
    ];

    let y = 40; // Initial Y position for text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('Payment Information', 40, y);
    y += 30; // Move down for content

    doc.setFontSize(10); // Smaller font for details
    rows.forEach(([label, val]) => {
        doc.text(label + ':', 40, y);
        doc.text(val || '—', 200, y); // Start value at 200pt X position
        y += 18; // Line height
    });
    
    doc.save(filename); // Save the PDF
    notify('📄 Payment PDF Generated!');
}

/**
 * Generates the service ticket output string based on form data.
 * The equipmentData is now passed directly.
 * @param {Array} equipmentData - The array of equipment data.
 */
export function generateServiceTicketOutput(equipmentData) {
    // Get all form data, including equipment, using the helper
    const data = getFormData(equipmentData); 
    let outputParts = [];
    const toUpper = (str) => (str || '').toUpperCase();

    // Construct the output data object
    const outputData = {
        jobsite: toUpper(data.jobsite),
        directions: toUpper(data.directions),
        name: toUpper(data.name),
        phone: toUpper(data.phone),
        email: toUpper(data.email),
        availability: toUpper(data.availability),
        request: toUpper(data.request),
        date: toUpper($('current-date')?.value).replace(/\//g, '-'), // Safely get current-date
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
    
    // Add primary contact and location info
    if (outputData.jobsite) outputParts.push(outputData.jobsite);
    if (outputData.directions) outputParts.push(outputData.directions);
    const contactInfo = [outputData.name, outputData.phone, outputData.email].filter(Boolean).join(', ');
    if (contactInfo) outputParts.push(contactInfo);
    if (outputData.availability) outputParts.push(outputData.availability);
    
    // Add equipment details
    if (data.equipment && data.equipment.length > 0) {
        const allDoorsInfo = data.equipment.map((door, index) => {
            const doorPart = door.door ? `DOOR ${index + 1}: ${door.door}` : '';
            const operatorPart = door.operator ? `OPERATOR: ${door.operator}` : '';
            return [doorPart, operatorPart].filter(Boolean).join(' ');
        }).filter(Boolean).join(' | ');
        if (allDoorsInfo) outputParts.push(toUpper(allDoorsInfo));
    }

    // Add request, date, and initials
    if (outputData.request) outputParts.push(outputData.request);
    outputParts.push(`TAKEN: ${outputData.date} ${outputData.initials}`);
    if (outputData.quotedAmount) outputParts.push(`QUOTED: ${outputData.quotedAmount}`);
    
    // Add payment information based on PO type
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
    
    outputParts.push('PLEASE CALL EN ROUTE'); // Standard closing line
    
    const out = outputParts.join('\n');
    $('output').value = out; // Display output in the <pre> tag
    $('output').style.display = 'block'; // Make output visible

    // Copy to clipboard
    navigator.clipboard.writeText(out).then(() => notify('📋 Service Ticket Output copied to clipboard!'))
        .catch(err => {
            console.error('Failed to copy text: ', err);
            notify('❌ Failed to copy output to clipboard.');
        });
}

/**
 * Generates the quote output string based on form data.
 * The equipmentData is now passed directly.
 * @param {Array} equipmentData - The array of equipment data.
 */
export function generateQuoteOutput(equipmentData) {
    // Get all form data, including equipment, using the helper
    const data = getFormData(equipmentData);
    let outputParts = [];
    const toUpper = (str) => (str || '').toUpperCase();

    // Add location information
    if (data.jobsite) outputParts.push(toUpper(data.jobsite));
    if (data.directions) outputParts.push(toUpper(data.directions));

    // Add contact information
    const contactName = toUpper(data.name);
    const contactPhone = toUpper(data.phone);
    const contactEmail = toUpper(data.email);
    let contactLine = [contactName, contactPhone].filter(Boolean).join(' ');
    if (contactEmail) contactLine += `; ${contactEmail}`;
    
    if (contactLine) outputParts.push(contactLine);
    
    // Add site specs and proposed work
    if (data.siteSpecs) outputParts.push(`SITE SPECS: ${toUpper(data.siteSpecs)}`);
    if (data.wePropose) outputParts.push(`WE PROPOSE: ${toUpper(data.wePropose)}`);
    
    outputParts.push("50% DEPOSIT REQUIRED TO PROCEED"); // Standard line

    // Add lead time
    if (data.leadTime) outputParts.push(`LEAD TIME: ${toUpper(data.leadTime)}`);

    const out = outputParts.join('\n');
    $('output').value = out; // Display output in the <pre> tag
    $('output').style.display = 'block'; // Make output visible
    
    // Copy to clipboard
    navigator.clipboard.writeText(out).then(() => notify('📋 Quote Output copied to clipboard!'))
        .catch(err => {
            console.error('Failed to copy text: ', err);
            notify('❌ Failed to copy output to clipboard.');
        });
}

/**
 * Prints the current record by generating HTML and opening it in an iframe.
 * The equipmentData is now passed directly.
 * @param {Array} equipmentData - The array of equipment data.
 */
export function printRecord(equipmentData) {
    // Get all form data, including equipment, using the helper
    const data = getFormData(equipmentData);
    
    // Helper function to sanitize text for HTML output
    const sanitize = (str) => {
        const temp = document.createElement('div');
        temp.textContent = str || '';
        return temp.innerHTML;
    };
    
    const customerName = data.name || '';
    const nameInitials = sanitize(customerName.substring(0, 0) + (customerName.length > 0 ? customerName.split(' ')[0].substring(0,1) + (customerName.split(' ').length > 1 ? customerName.split(' ')[customerName.split(' ').length - 1].substring(0,1) : '') : '')).toUpperCase(); // Safely get initials
    const docId = sanitize(data.docId || '');
    
    // Define labels for form fields for cleaner print output
    const fieldLabels = { 
        'siteSpecs': 'Site Specs', 'initials': 'CSR Initials', 'billing': 'Billing Address', 
        'jobsite': 'Jobsite Address', 'name': 'Name', 'phone': 'Phone', 'email': 'Email', 
        'availability': 'Availability', 'request': 'Work Requested', 'notes': 'Notes', 
        'paymentAccountName': 'Account Name', 'paymentAccountNumber': 'Account Number', 
        'paymentExpDate': 'Exp Date', 'paymentSecurityCode': 'Security Code', 
        'billingChanges': 'Billing Address Changes', 'depositAmount': 'Deposit Amount', 
        'remainingBalance': 'Remaining Balance', 'tsNumber': 'Legacy TS Number', 
        'receiptMethod': 'Receipt Method', 'directions': 'Directions', 
        'installDate': 'Install Date', 'installer': 'Installer', 'callType': 'Call Type', 
        'warrantyTsNumber': 'Original TS Number', 'quotedAmount': 'Quoted Amount', 
        'wePropose': 'We Propose', 'leadTime': 'Lead Time' 
    };
    // Define labels for equipment fields
    const equipmentLabels = { 
        'door': 'Door Info', 'operator': 'Operator Info', 'floorCeiling': 'Floor to Ceiling', 
        'floorObstruction': 'Floor to Lowest Obstruction', 'construction': 'Construction Type', 
        'backroom': 'Backroom', 'sideroom': 'Sideroom', 'headroom': 'Headroom', 'power': 'Power', 
        'color': 'Color', 'jambs': 'Jambs', 'floor': 'Floor', 'doorSize': 'Door Size', 
        'opening': 'Opening Size', 'corner': 'Corner Type', 'track': 'Track Radius', 
        'spring': 'Spring Info', 'weatherstop': 'Weatherstop Color' 
    };

    // Base HTML structure for the print preview
    let printHtml = `
        <style>
            body { font-family: sans-serif; margin: 2rem; color: #333; }
            .print-main-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .print-main-header h1 { font-size: 1.8rem; margin: 0; text-align: left; }
            .print-header-info { text-align: right; flex-shrink: 0; }
            .file-initials { font-size: 48px; font-weight: bold; color: #cccccc; line-height: 1; }
            .print-doc-id { font-size: 0.8rem; color: #999999; font-family: monospace; margin-top: 0.25rem; }
            .section { margin-bottom: 1.5rem; border-bottom: 1px solid #ccc; padding-bottom: 1rem; page-break-inside: avoid; }
            .section:last-of-type { border-bottom: none; }
            .section h2 { font-size: 1.2rem; border-bottom: 2px solid #333; padding-bottom: 0.3rem; margin-bottom: 1rem; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .item { margin-bottom: 0.5rem; }
            .item strong { display: block; color: #555; font-size: 0.9rem; }
            .full-width { grid-column: 1 / -1; }
            div { white-space: pre-wrap; word-break: break-word; }
            @media print {
                body { margin: 0.5in; }
                .print-main-header, .section { page-break-after: auto; }
                .grid { display: block; } /* Change to block layout for printing to ensure wrapping */
                .item { margin-bottom: 0.25rem; }
            }
        </style>
        <div class="print-main-header">
            <h1>Job Intake Record</h1>
            <div class="print-header-info">
                <div class="file-initials">${nameInitials}</div>
                <div class="print-doc-id">${docId}</div>
            </div>
        </div>
    `;

    /**
     * Helper to create a section for the print output.
     * @param {string} title - The title of the section.
     * @param {Array<string>} fields - Array of field IDs to include in this section.
     * @param {object} sourceData - The data object to retrieve values from.
     * @returns {string} HTML string for the section.
     */
    const createSection = (title, fields, sourceData) => {
        let content = '';
        fields.forEach(id => {
            const value = sourceData[id];
            if (value) {
                const isTextArea = ['billing', 'jobsite', 'request', 'notes', 'door', 'operator', 'spring', 'directions', 'wePropose', 'siteSpecs', 'billingChanges'].includes(id);
                const colClass = isTextArea ? 'full-width' : '';
                content += `<div class="item ${colClass}"><strong>${fieldLabels[id] || id}:</strong> <div>${sanitize(value)}</div></div>`;
            }
        });
        if (content) {
            return `<div class="section"><h2>${title}</h2><div class="grid">${content}</div></div>`;
        }
        return '';
    };
    
    // Add sections to the print HTML
    printHtml += createSection('Job & Contact Info', ['callType', 'initials', 'name', 'phone', 'email', 'availability', 'billing', 'jobsite', 'directions'], data);
    printHtml += createSection('Work & Notes', ['request', 'notes'], data);
    printHtml += createSection('Site Specs', ['siteSpecs'], data);
    printHtml += createSection('Quote Details', ['wePropose', 'leadTime', 'quotedAmount'], data);
    
    // Add Equipment sections dynamically
    if(data.equipment && data.equipment.length > 0) {
        data.equipment.forEach((door, index) => {
            let doorContent = '';
            // Iterate over all possible equipment fields
            Object.keys(equipmentLabels).forEach(id => {
                const value = door[id];
                if (value) {
                    const isTextArea = ['door', 'operator', 'spring'].includes(id);
                    const colClass = isTextArea ? 'full-width' : '';
                    doorContent += `<div class="item ${colClass}"><strong>${equipmentLabels[id]}:</strong> <div>${sanitize(value)}</div></div>`;
                }
            });
            if(doorContent) {
                printHtml += `<div class="section"><h2>Equipment: Door ${index + 1}</h2><div class="grid">${doorContent}</div></div>`
            }
        });
    }
    
    printHtml += createSection('Warranty', ['installDate', 'installer', 'warrantyTsNumber'], data);
    printHtml += createSection('Payment Details', ['paymentAccountName', 'paymentAccountNumber', 'paymentExpDate', 'paymentSecurityCode', 'depositAmount', 'remainingBalance', 'tsNumber', 'receiptMethod', 'billingChanges'], data);

    // Create an iframe to print the content
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame); // Append to body to load content

    // Write content to iframe and trigger print
    printFrame.contentDocument.open();
    printFrame.contentDocument.write(printHtml);
    printFrame.contentDocument.close();
    
    // Focus and print the iframe content
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    
    // Remove the iframe after printing (with a small delay)
    setTimeout(() => { document.body.removeChild(printFrame); }, 1000);

    notify('🖨️ Print initiated!');
}

