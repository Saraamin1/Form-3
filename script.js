(function () {
  'use strict';

  const STORAGE_KEY = 'excavation-trenching-safety-v3';

  function formatDate(value) {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return value;
  }

  function formatDateTime(value) {
    if (!value) return '';
    const [date, time] = value.split('T');
    if (!date) return value;
    return `${formatDate(date)}${time ? ` ${time}` : ''}`;
  }

  function displayValue(input) {
    if (!input) return '';
    if (input.type === 'date') return formatDate(input.value);
    if (input.type === 'datetime-local') return formatDateTime(input.value);
    return input.value || '';
  }

  function saveState() {
    const data = {
      inputs: Array.from(document.querySelectorAll('input.info-input, .atmospheric-grid input, .signature-box input')).map(input => input.value),
      notes: document.querySelector('.notes-area')?.value || '',
      status: document.querySelector('.status-item.selected')?.textContent.trim() || '',
      checklist: Array.from(document.querySelectorAll('.checklist-item')).map(item =>
        item.querySelector('.checkbox-option.selected .checkbox-option-label')?.textContent.trim() || ''
      )
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadState() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!data) return;

      const inputs = document.querySelectorAll('input.info-input, .atmospheric-grid input, .signature-box input');
      (data.inputs || []).forEach((value, i) => {
        if (inputs[i]) inputs[i].value = value;
      });

      const notes = document.querySelector('.notes-area');
      if (notes) notes.value = data.notes || '';

      document.querySelectorAll('.status-item').forEach(item => {
        item.classList.toggle('selected', !!data.status && item.textContent.trim() === data.status);
      });

      document.querySelectorAll('.checklist-item').forEach((item, i) => {
        const wanted = data.checklist?.[i] || '';
        item.querySelectorAll('.checkbox-option').forEach(option => {
          option.classList.toggle('selected', !!wanted && option.textContent.trim() === wanted);
        });
      });
    } catch (e) {
      console.warn('Could not load saved form data.', e);
    }
  }

  function setupInteractions() {
    document.querySelectorAll('.status-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.status-item').forEach(x => x.classList.remove('selected'));
        item.classList.add('selected');
        saveState();
      });
    });

    document.querySelectorAll('.checklist-item').forEach(item => {
      item.querySelectorAll('.checkbox-option').forEach(option => {
        option.addEventListener('click', () => {
          item.querySelectorAll('.checkbox-option').forEach(x => x.classList.remove('selected'));
          option.classList.add('selected');
          saveState();
        });
      });
    });

    document.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', saveState);
      el.addEventListener('change', saveState);
    });
  }

  function addAppStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #app-toolbar{position:sticky;top:0;z-index:9999;display:flex;gap:10px;justify-content:center;align-items:center;padding:12px;background:#fff;border-bottom:1px solid #ddd;margin:-36pt -36pt 20pt;box-shadow:0 2px 8px rgba(0,0,0,.08)}
      .btn{border:0;border-radius:6px;padding:10px 16px;font-weight:700;cursor:pointer;color:#fff;font-family:inherit}
      .btn-pdf{background:#dc143c}.btn-word{background:#1e3a5f}.btn-clear{background:#6c757d}
      .status-item,.checkbox-option{cursor:pointer}
      .status-item.selected,.checkbox-option.selected{outline:3px solid #1e3a5f;outline-offset:2px;border-radius:4px}
      .checkbox-option.selected .checkbox-small,.status-item.selected .checkbox-large{background:#1e3a5f!important;color:#fff!important;border-color:#1e3a5f!important}
      input[type=date],input[type=datetime-local]{min-height:30px;cursor:pointer}
      @media(max-width:600px){#app-toolbar{position:static;flex-wrap:wrap;margin:-36pt -36pt 16pt}.btn{flex:1;min-width:120px}.header-info{grid-template-columns:1fr!important}.status-summary{grid-template-columns:1fr!important}}
      @media print{#app-toolbar{display:none!important}.selected{outline:none!important}}
    `;
    document.head.appendChild(style);
  }

  function buildPrintableClone() {
    const clone = document.body.cloneNode(true);
    clone.querySelector('#app-toolbar')?.remove();

    clone.querySelectorAll('input').forEach((input, index) => {
      const original = document.querySelectorAll('input')[index];
      const span = document.createElement('span');
      span.textContent = displayValue(original) || ' ';
      span.style.cssText = 'display:inline-block;min-width:100px;border-bottom:1px solid #343A40;padding:3px 2px;';
      input.replaceWith(span);
    });

    clone.querySelectorAll('textarea').forEach((textarea, index) => {
      const original = document.querySelectorAll('textarea')[index];
      const div = document.createElement('div');
      div.textContent = original?.value || ' ';
      div.style.cssText = 'min-height:70px;border:1px solid #aaa;padding:8px;white-space:pre-wrap;';
      textarea.replaceWith(div);
    });

    clone.querySelectorAll('.checkbox-option').forEach(option => {
      const box = option.querySelector('.checkbox-small');
      if (box) box.textContent = option.classList.contains('selected') ? '✓' : '□';
    });

    clone.querySelectorAll('.status-item').forEach(item => {
      const box = item.querySelector('.checkbox-large');
      if (box) box.textContent = item.classList.contains('selected') ? '✓' : '□';
    });

    return clone;
  }

  async function savePDF() {
    if (!window.html2pdf) {
      alert('PDF library is not loaded. Check your internet connection and reload the page.');
      return;
    }

    saveState();

    const clone = buildPrintableClone();

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'background:#fff;width:100%;padding:18px;box-sizing:border-box;';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
      await html2pdf().set({
        margin: 0.35,
        filename: 'excavation-trenching-safety-inspection.pdf',
        image: {
          type: 'jpeg',
          quality: 0.98
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait'
        }
      }).from(wrapper).save();
    } finally {
      wrapper.remove();
    }
  }

  function textCell(text, bold) {
    const { TableCell, Paragraph, TextRun } = window.docx;

    return new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: String(text || ''),
              bold: !!bold,
              size: 20
            })
          ]
        })
      ]
    });
  }

  function makeDocx() {
    if (!window.docx) {
      throw new Error('DOCX library is not loaded');
    }

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      HeadingLevel,
      AlignmentType,
      WidthType
    } = window.docx;

    const children = [];

    children.push(
      new Paragraph({
        text: 'Excavation & Trenching Safety Inspection',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER
      })
    );

    const headerInputs = Array.from(
      document.querySelectorAll('.header-info input')
    );

    const headerLabels = Array.from(
      document.querySelectorAll('.header-info .info-label')
    ).map(x => x.textContent.trim());

    children.push(
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        },
        rows: headerLabels.map((label, i) =>
          new TableRow({
            children: [
              textCell(label, true),
              textCell(displayValue(headerInputs[i]))
            ]
          })
        )
      })
    );

    children.push(new Paragraph({ text: '' }));

    const os = document.querySelector('.info-box')?.innerText.trim() || '';

    if (os) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: os,
              bold: true,
              size: 20
            })
          ]
        })
      );
    }

    const status =
      document.querySelector('.status-item.selected')?.textContent.trim() ||
      'Not selected';

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Overall Status: ',
            bold: true
          }),
          new TextRun({
            text: status
          })
        ]
      })
    );

    const alert =
      document.querySelector('.alert-box')?.innerText.trim();

    if (alert) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: alert,
              bold: true
            })
          ]
        })
      );
    }

    const sections =
      Array.from(document.querySelectorAll('.checklist-section'));

    const headings =
      Array.from(document.querySelectorAll('h2'));

    sections.forEach((section, idx) => {
      children.push(
        new Paragraph({
          text:
            headings[idx]?.textContent.trim() ||
            `Section ${idx + 1}`,
          heading: HeadingLevel.HEADING_2
        })
      );

      const rows = [
        new TableRow({
          children: [
            textCell('Inspection Item', true),
            textCell('Status', true)
          ]
        })
      ];

      section.querySelectorAll('.checklist-item').forEach(item => {
        const question =
          item.querySelector('.item-text')?.textContent.trim() ||
          '';

        const selected =
          item.querySelector(
            '.checkbox-option.selected .checkbox-option-label'
          )?.textContent.trim() ||
          'Not selected';

        rows.push(
          new TableRow({
            children: [
              textCell(question),
              textCell(selected)
            ]
          })
        );
      });

      children.push(
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE
          },
          rows
        })
      );

      children.push(new Paragraph({ text: '' }));
    });

    const atm =
      document.querySelector('.atmospheric-grid');

    if (atm) {
      children.push(
        new Paragraph({
          text: 'Atmospheric Readings',
          heading: HeadingLevel.HEADING_2
        })
      );

      const labels =
        Array.from(
          atm.querySelectorAll('.info-label')
        ).map(x => x.textContent.trim());

      const vals =
        Array.from(
          atm.querySelectorAll('input')
        ).map(x => x.value);

      children.push(
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE
          },
          rows: labels.map((label, i) =>
            new TableRow({
              children: [
                textCell(label, true),
                textCell(vals[i] || '')
              ]
            })
          )
        })
      );
    }

    const notes =
      document.querySelector('.notes-area')?.value || '';

    children.push(
      new Paragraph({
        text: 'Hazards Identified & Corrective Actions Taken',
        heading: HeadingLevel.HEADING_2
      })
    );

    children.push(
      new Paragraph({
        text: notes || ' '
      })
    );

    children.push(
      new Paragraph({
        text: 'Signatures',
        heading: HeadingLevel.HEADING_2
      })
    );

    document.querySelectorAll('.signature-box').forEach(box => {
      const label =
        box.querySelector('.signature-label')?.textContent.trim() ||
        '';

      const labels =
        Array.from(
          box.querySelectorAll('.info-label')
        ).map(x => x.textContent.trim());

      const vals =
        Array.from(
          box.querySelectorAll('input')
        ).map(x => displayValue(x));

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: label,
              bold: true
            })
          ]
        })
      );

      labels.forEach((l, i) => {
        children.push(
          new Paragraph({
            text: `${l} ${vals[i] || ''}`
          })
        );
      });

      children.push(
        new Paragraph({
          text: ''
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children
        }
      ]
    });

    return Packer.toBlob(doc);
  }

  async function saveWord() {
    if (!window.docx) {
      alert(
        'Word library is not loaded. Check your internet connection and reload the page.'
      );
      return;
    }

    try {
      saveState();

      const blob = await makeDocx();

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;
      a.download =
        'excavation-trenching-safety-inspection.docx';

      document.body.appendChild(a);

      a.click();

      a.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

    } catch (e) {
      console.error(e);

      alert(
        'تعذر إنشاء ملف Word. تأكدي من وجود اتصال بالإنترنت ثم أعيدي تحميل الصفحة.'
      );
    }
  }

  function clearForm() {
    if (!confirm('Clear all entered data and selections?')) {
      return;
    }

    document.querySelectorAll('input').forEach(input => {
      if (
        input.type === 'checkbox' ||
        input.type === 'radio'
      ) {
        input.checked = false;
      } else {
        input.value = '';
      }
    });

    document
      .querySelectorAll('textarea')
      .forEach(textarea => textarea.value = '');

    document
      .querySelectorAll('.selected')
      .forEach(x => x.classList.remove('selected'));

    localStorage.removeItem(STORAGE_KEY);
  }

  document.addEventListener('DOMContentLoaded', () => {
    addAppStyles();

    setupInteractions();

    loadState();

    document
      .getElementById('savePdfBtn')
      ?.addEventListener('click', savePDF);

    document
      .getElementById('saveWordBtn')
      ?.addEventListener('click', saveWord);

    document
      .getElementById('clearBtn')
      ?.addEventListener('click', clearForm);
  });

})();
