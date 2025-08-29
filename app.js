// Helper functions
const removeDiacritics = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
const removeNaNFromText = text => text.replace(/ \(NaN\)/g, '');
const removeDuplicateSanctions = text => text.replace(/: (\d+ ?€): \1/g, ': $1');
const quitarCoso = text => text.replace(/\s€ar usuario: razon:/, '');
const removePlusMinusFromText = text => text.replace(/\+|-/g, '');

// Main functions
const filterArticles = query => {
    const normalizedQuery = removeDiacritics(query.toLowerCase());
    document.querySelectorAll('#articlesList li').forEach(item => {
        const normalizedDesc = removeDiacritics(item.textContent.toLowerCase());
        item.style.display = normalizedDesc.includes(normalizedQuery) ? '' : 'none';
    });
};

const userEnteredSanctions = new Map();

const getSanctionValue = item => {
    const itemId = item.id;
    if (userEnteredSanctions.has(itemId)) return userEnteredSanctions.get(itemId);

    const sanctionText = item.getAttribute('data-sancion');
    const rangeMatch = sanctionText.match(/(\d+)\s*-\s*(\d+)\s*€/);

    if (rangeMatch) {
        const [, minValue, maxValue] = rangeMatch.map(Number);
        const userInput = prompt(`Ingrese una cantidad entre ${minValue} y ${maxValue}:`, '');
        if (userInput === null) return 0;

        const inputValue = parseFloat(userInput);
        if (isNaN(inputValue) || inputValue < minValue || inputValue > maxValue) {
            alert(`Debe ingresar un valor válido entre ${minValue} y ${maxValue}.`);
            return getSanctionValue(item);
        }
        userEnteredSanctions.set(itemId, inputValue);
        return inputValue;
    }

    const sanctionValue = parseFloat(sanctionText.replace('€', '').trim());
    if (isNaN(sanctionValue)) {
        console.warn(`Invalid sanction value for item: ${item.innerText}`);
        return 0;
    }
    userEnteredSanctions.set(itemId, sanctionValue);
    return sanctionValue;
};

const updateCommand = () => {
    const commandElem = document.getElementById('command');
    const arrestReportElem = document.getElementById('arrestReport');
    const razonElem = document.getElementById('razon');

    const selectedItems = Array.from(document.querySelectorAll('li.bg-white'))
        .sort((a, b) => a.innerText.trim().localeCompare(b.innerText.trim()));

    let totalSanction = 0;
    let totalSinPrefijo = 0;
    let totalConPrefijo = 0;
    const articulosDeArresto = [];
    let commandText = "/multar usuario: razon:";

    selectedItems.forEach(item => {
        const sanctionValue = getSanctionValue(item);
        totalSanction += sanctionValue;

        let modifiedText = item.innerText.trim();
        const rangeMatch = modifiedText.match(/(\d+)\s*-\s*(\d+)\s*€/);

        if (rangeMatch) {
            modifiedText = modifiedText.replace(/: \d+\s*-\s*\d+\s*€.*/, `: ${sanctionValue} €`);
        } else if (['Tráfico de drogas', 'Posesión de estupefacientes', 'Tráfico de personas', 'Tráfico de menores']
            .some(phrase => modifiedText.includes(phrase))) {
            modifiedText = `${modifiedText} (${sanctionValue} €)`;
        }

        const splitText = modifiedText.split(':');
        commandText += splitText.length > 2 
            ? `\n${splitText[0]}: ${sanctionValue} €`
            : `\n${modifiedText}`;

        item.innerText.startsWith("art-1") ? totalConPrefijo += sanctionValue : totalSinPrefijo += sanctionValue;
        articulosDeArresto.push(modifiedText);
    });

    commandText = `/multas poner usuario: razon:\nTotal: € ${commandText.substr(5)}`;
    commandElem.textContent = quitarCoso(removePlusMinusFromText(commandText));

    if (totalSinPrefijo > 1000 || totalConPrefijo > 2000) {
        arrestReportElem.classList.remove('hidden');
        razonElem.innerHTML = removePlusMinusFromText('razon: <br>' + articulosDeArresto.join('<br>'));
    } else {
        arrestReportElem.classList.add('hidden');
    }
};
// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('bg-white');
            updateCommand();
        });
    });

    document.getElementById('searchInput').addEventListener('input', e => filterArticles(e.target.value));
    document.getElementById('goToCommand').addEventListener('click', () => window.scrollTo(0, document.body.scrollHeight));
    document.getElementById('copyButton').addEventListener('click', () => {
        const textarea = document.getElementById('command');
        textarea.select();
        document.execCommand('copy');
    });
});
