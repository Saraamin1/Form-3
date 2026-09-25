(function () {
    // ================= INTERACTIVE CHECKBOXES =================
    var statusBoxes = document.querySelectorAll('.status-summary .checkbox-large');
    statusBoxes.forEach(function (box) {
        box.addEventListener('click', function () {
            var wasChecked = box.classList.contains('checked');
            statusBoxes.forEach(function (b) { b.classList.remove('checked'); });
            if (!wasChecked) box.classList.add('checked');
        });
    });

    document.querySelectorAll('.checkbox-container').forEach(function (container) {
        var boxes = container.querySelectorAll('.checkbox-small');
        boxes.forEach(function (box) {
            box.addEventListener('click', function () {
                var wasChecked = box.classList.contains('checked');
                boxes.forEach(function (b) { b.classList.remove('checked'); });
                if (!wasChecked) box.classList.add('checked');
            });
        });
    });

    // ================= RESET FORM =================
    document.getElementById('resetBtn').addEventListener('click', function () {
        if (!confirm('Clear all entries and selections?')) return;
        document.querySelectorAll('#printable input, #printable textarea').forEach(function (el) { el.value = ''; });
        document.querySelectorAll('#printable .checked').forEach(function (el) { el.classList.remove('checked'); });
    });

    // ================= CUSTOM DATE / TIME PICKER =================
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function closeAllPickers() {
        document.querySelectorAll('.picker-popover').forEach(function (p) { p.remove(); });
    }

    function positionPopover(pop, input) {
        var rect = input.getBoundingClientRect();
        pop.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        pop.style.left = (rect.left + window.scrollX) + 'px';
    }

    function attachDatePicker(input) {
        input.addEventListener('click', function (e) {
            e.stopPropagation();
            var alreadyOpen = input._open;
            closeAllPickers();
            input._open = false;
            if (alreadyOpen) return;
            input._open = true;

            var today = new Date();
            var parsed = input.value ? new Date(input.value) : null;
            var base = parsed && !isNaN(parsed) ? parsed : today;
            var viewYear = base.getFullYear();
            var viewMonth = base.getMonth();

            var pop = document.createElement('div');
            pop.className = 'picker-popover';
            document.body.appendChild(pop);

            function render() {
                var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                var firstDay = new Date(viewYear, viewMonth, 1).getDay();
                var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

                var html = '<div class="picker-header">' +
                    '<button type="button" class="picker-nav" data-nav="-1">&#8249;</button>' +
                    '<span>' + monthNames[viewMonth] + ' ' + viewYear + '</span>' +
                    '<button type="button" class="picker-nav" data-nav="1">&#8250;</button>' +
                    '</div><div class="picker-grid">';
                ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d) { html += '<span class="picker-dow">' + d + '</span>'; });
                for (var i = 0; i < firstDay; i++) html += '<span></span>';
                for (var d = 1; d <= daysInMonth; d++) html += '<span class="picker-day" data-day="' + d + '">' + d + '</span>';
                html += '</div>';
                pop.innerHTML = html;

                pop.querySelectorAll('.picker-nav').forEach(function (btn) {
                    btn.addEventListener('click', function (ev) {
                        ev.stopPropagation();
                        viewMonth += parseInt(btn.getAttribute('data-nav'), 10);
                        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
                        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
                        render();
                    });
                });

                pop.querySelectorAll('.picker-day').forEach(function (dayEl) {
                    dayEl.addEventListener('click', function (ev) {
                        ev.stopPropagation();
                        var day = parseInt(dayEl.getAttribute('data-day'), 10);
                        input.value = pad(viewMonth + 1) + '/' + pad(day) + '/' + viewYear;
                        pop.remove();
                        input._open = false;
                    });
                });
            }

            render();
            positionPopover(pop, input);
        });
    }

    function attachTimePicker(input) {
        input.addEventListener('click', function (e) {
            e.stopPropagation();
            var alreadyOpen = input._open;
            closeAllPickers();
            input._open = false;
            if (alreadyOpen) return;
            input._open = true;

            var pop = document.createElement('div');
            pop.className = 'picker-popover picker-time';
            document.body.appendChild(pop);

            var hours = [];
            for (var h = 1; h <= 12; h++) hours.push(h);
            var minutes = [];
            for (var m = 0; m < 60; m += 5) minutes.push(m);

            var html = '<div class="picker-time-row">' +
                '<select class="picker-hour">' + hours.map(function (h) { return '<option value="' + h + '">' + h + '</option>'; }).join('') + '</select>' +
                '<span>:</span>' +
                '<select class="picker-minute">' + minutes.map(function (m) { return '<option value="' + m + '">' + pad(m) + '</option>'; }).join('') + '</select>' +
                '<select class="picker-ampm"><option value="AM">AM</option><option value="PM">PM</option></select>' +
                '</div><button type="button" class="picker-set">Set Time</button>';
            pop.innerHTML = html;

            pop.querySelector('.picker-set').addEventListener('click', function (ev) {
                ev.stopPropagation();
                var hh = pop.querySelector('.picker-hour').value;
                var mm = pop.querySelector('.picker-minute').value;
                var ap = pop.querySelector('.picker-ampm').value;
                input.value = hh + ':' + pad(parseInt(mm, 10)) + ' ' + ap;
                pop.remove();
                input._open = false;
            });

            positionPopover(pop, input);
        });
    }

    document.addEventListener('click', function () { closeAllPickers(); });

    document.querySelectorAll('input[data-picker="date"]').forEach(attachDatePicker);
    document.querySelectorAll('input[data-picker="time"]').forEach(attachTimePicker);

    // ================= Push live values into attributes so exports see them =================
    function syncValuesForExport(root) {
        root.querySelectorAll('input[type="text"]').forEach(function (input) { input.setAttribute('value', input.value); });
        root.querySelectorAll('textarea').forEach(function (ta) { ta.textContent = ta.value; });
    }

    // ================= PDF EXPORT =================
    document.getElementById('downloadPdfBtn').addEventListener('click', function () {
        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Preparing PDF…';

        closeAllPickers();

        var el = document.getElementById('printable');
        syncValuesForExport(el);

        var opt = {
            margin: 0.4,
            filename: 'Excavation-Trenching-Safety-Inspection.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: el.scrollWidth },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(el).save().then(function () {
            btn.disabled = false;
            btn.textContent = '⬇ Download PDF';
        }).catch(function (err) {
            console.error(err);
            btn.disabled = false;
            btn.textContent = '⬇ Download PDF';
            alert('PDF generation failed: ' + err.message);
        });
    });

    // ================= REAL WORD (.docx) EXPORT =================
    document.getElementById('downloadWordBtn').addEventListener('click', function () {
        var btn = this;
        btn.disabled = true;
        var originalLabel = btn.textContent;
        btn.textContent = 'Preparing Word file…';

        closeAllPickers();

        try {
            // Check if docx library is loaded
            if (typeof docx === 'undefined') {
                throw new Error('docx library is not loaded. Please check your HTML head script tags.');
            }

            var Document = docx.Document;
            var Packer = docx.Packer;
            var Paragraph = docx.Paragraph;
            var TextRun = docx.TextRun;
            var HeadingLevel = docx.HeadingLevel;
            var Table = docx.Table;
            var TableRow = docx.TableRow;
            var TableCell = docx.TableCell;
            var WidthType = docx.WidthType;

            var children = [];

            // Title
            var h1El = document.querySelector('#printable h1');
            children.push(new Paragraph({
                text: h1El ? h1El.textContent.trim() : "EXCAVATION & TRENCHING SAFETY INSPECTION",
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 200 }
            }));

            // Extract Info Fields
            document.querySelectorAll('#printable .info-field').forEach(function (f) {
                var labEl = f.querySelector('.info-label');
                var inpEl = f.querySelector('input');
                var labelText = labEl ? labEl.textContent.trim() : '';
                var valText = inpEl && inpEl.value.trim() !== '' ? inpEl.value.trim() : '______________________';

                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: labelText + ": ", bold: true }),
                        new TextRun(valText)
                    ],
                    spacing: { after: 100 }
                }));
            });

            // Status Summary
            var chosenStatus = '(not selected)';
            document.querySelectorAll('#printable .status-summary .status-item').forEach(function (item) {
                var box = item.querySelector('.checkbox-large');
                var lab = item.querySelector('.checkbox-label');
                if (box && box.classList.contains('checked') && lab) chosenStatus = lab.textContent.trim();
            });
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: "Overall Status: ", bold: true }),
                    new TextRun(chosenStatus)
                ],
                spacing: { before: 150, after: 200 }
            }));

            // Checklist Sections
            document.querySelectorAll('#printable h2').forEach(function (h2) {
                children.push(new Paragraph({
                    text: h2.textContent.trim(),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 }
                }));

                var checklistSection = h2.nextElementSibling;
                if (checklistSection && checklistSection.classList.contains('checklist-section')) {
                    var tableRows = [];
                    checklistSection.querySelectorAll('.checklist-item').forEach(function (item) {
                        var chosenOpt = '-';
                        item.querySelectorAll('.checkbox-option').forEach(function (opt) {
                            var box = opt.querySelector('.checkbox-small');
                            var lab = opt.querySelector('.checkbox-option-label');
                            if (box && box.classList.contains('checked') && lab) chosenOpt = lab.textContent.trim();
                        });
                        var textEl = item.querySelector('.item-text');
                        var textStr = textEl ? textEl.textContent.trim() : '';

                        tableRows.push(new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 20, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: chosenOpt, bold: true })]
                                }),
                                new TableCell({
                                    width: { size: 80, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph(textStr)]
                                })
                            ]
                        }));
                    });

                    if (tableRows.length > 0) {
                        children.push(new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: tableRows
                        }));
                    }
                }
            });

            // Notes Section
            var notesTa = document.querySelector('#printable .notes-section textarea');
            if (notesTa) {
                children.push(new Paragraph({
                    text: "Notes & Corrective Actions:",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 }
                }));
                children.push(new Paragraph({
                    text: notesTa.value.trim() !== '' ? notesTa.value : 'None',
                    spacing: { after: 200 }
                }));
            }

            // Create Document
            var doc = new Document({
                sections: [{
                    properties: {},
                    children: children
                }]
            });

            // Save File using FileSaver.js / Packer
            Packer.toBlob(doc).then(function (blob) {
                saveAs(blob, "Excavation-Trenching-Safety-Inspection.docx");
                btn.disabled = false;
                btn.textContent = originalLabel;
            }).catch(function (err) {
                throw err;
            });

        } catch (err) {
            console.error(err);
            alert('Word file generation failed: ' + err.message);
            btn.disabled = false;
            btn.textContent = originalLabel;
        }
    });
})();
