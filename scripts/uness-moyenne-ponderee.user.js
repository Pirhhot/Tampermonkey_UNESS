// ==UserScript==
// @name         Moyenne Uness
// @namespace    https://entrainement.uness.fr/
// @version      1.1
// @description  Bouton flottant pour calculer la moyenne globale pondérée par le nombre de questions pour chaque tentative sur les annales UNESS.
// @author       Thomas Berthomier avec Gemini
// @match        https://entrainement.uness.fr/annales/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=uness.fr
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // 1. Ajouter l'option dans le menu de l'extension Tampermonkey
    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("📊 Calculer la moyenne pondérée", startAnalysis);
    }

    // 2. Créer le bouton flottant en bas à droite
    function createFloatingButton() {
        if (document.getElementById('uness-floating-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'uness-floating-btn';
        btn.innerHTML = '📊 Calculer Moyenne';
        btn.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 999999;
            background-color: #0f4c81;
            color: #ffffff;
            border: none;
            padding: 12px 22px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 14px;
            font-family: inherit;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s ease-in-out;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = '#0b3860';
            btn.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = '#0f4c81';
            btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('click', startAnalysis);
        document.body.appendChild(btn);
    }

    // 3. Extraction de la liste des dossiers sur la page de l'épreuve
    function getQuizLinks() {
        const links = [];
        const quizElements = document.querySelectorAll('li.activity.modtype_quiz');

        quizElements.forEach(el => {
            const a = el.querySelector('a.aalink');
            if (a) {
                const instanceSpan = el.querySelector('.instancename');
                let name = instanceSpan ? instanceSpan.childNodes[0].textContent.trim() : a.textContent.trim();
                links.push({
                    id: el.dataset.id || a.href,
                    name: name,
                    url: a.href
                });
            }
        });
        return links;
    }

    // 4. Extraction des tentatives et du nombre de questions sur une page de dossier
    async function parseQuizPage(url) {
        const res = await fetch(url, { credentials: 'same-origin' });
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const summaryTable = doc.querySelector('table.quizattemptsummary');
        if (!summaryTable) {
            return { totalQuestions: 0, attempts: [] };
        }

        // Extraction du nombre de points max (nombre de questions) dans le th.c2 ("Points / X,XX")
        let totalQuestions = 0;
        const thPoints = summaryTable.querySelector('thead th.c2');
        if (thPoints) {
            const match = thPoints.textContent.match(/Points\s*\/\s*([\d,.]+)/i);
            if (match) {
                totalQuestions = parseFloat(match[1].replace(',', '.'));
            }
        }

        const attempts = [];
        const rows = summaryTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const stateTd = row.querySelector('td.c1');
            const pointsTd = row.querySelector('td.c2');
            const noteTd = row.querySelector('td.c3');
            const numTd = row.querySelector('td.c0');

            if (stateTd && stateTd.textContent.includes('Terminée') && pointsTd && noteTd) {
                const attemptNum = parseInt(numTd.textContent.trim(), 10) || (attempts.length + 1);
                const pointsObtained = parseFloat(pointsTd.textContent.replace(',', '.'));
                const note20 = parseFloat(noteTd.textContent.replace(',', '.'));

                attempts.push({
                    attempt: attemptNum,
                    points: pointsObtained,
                    note: note20
                });
            }
        });

        return { totalQuestions, attempts };
    }

    // 5. Interface modale d'affichage des résultats
    function createModal() {
        let modal = document.getElementById('uness-calc-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'uness-calc-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.6); z-index: 9999999; display: flex;
            align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif;
        `;

        modal.innerHTML = `
            <div style="background: #fff; border-radius: 10px; width: 90%; max-width: 850px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div style="padding: 16px 20px; background: #0f4c81; color: white; display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0; font-size: 1.2rem; color: white; font-weight: 600;">Synthèse des Notes Pondérées</h4>
                    <button id="uness-close-modal" style="background: none; border: none; color: white; font-size: 1.6rem; cursor: pointer; line-height: 1;">&times;</button>
                </div>
                <div id="uness-modal-body" style="padding: 20px; overflow-y: auto; flex: 1;">
                    <div id="uness-progress" style="margin-bottom: 15px; font-weight: 600; color: #0f4c81;">Chargement des données...</div>
                    <div id="uness-results-content"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById('uness-close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    // 6. Procédure principale déclenchée au clic
    async function startAnalysis() {
        const quizList = getQuizLinks();
        if (quizList.length === 0) {
            alert("Aucun dossier ou SQI trouvé sur cette page.");
            return;
        }

        createModal();
        const progressEl = document.getElementById('uness-progress');
        const contentEl = document.getElementById('uness-results-content');

        const results = [];
        let count = 0;

        for (const quiz of quizList) {
            count++;
            progressEl.textContent = `Récupération (${count}/${quizList.length}) : ${quiz.name}...`;
            try {
                const data = await parseQuizPage(quiz.url);
                results.push({
                    name: quiz.name,
                    questions: data.totalQuestions,
                    attempts: data.attempts
                });
            } catch (err) {
                console.error(`Erreur sur ${quiz.name}`, err);
            }
        }

        progressEl.style.display = 'none';

        // Regroupement par tentative
        const attemptsMap = {};
        results.forEach(res => {
            res.attempts.forEach(att => {
                if (!attemptsMap[att.attempt]) {
                    attemptsMap[att.attempt] = { totalPoints: 0, totalMax: 0, count: 0 };
                }
                attemptsMap[att.attempt].totalPoints += att.points;
                attemptsMap[att.attempt].totalMax += res.questions;
                attemptsMap[att.attempt].count++;
            });
        });

        const attemptKeys = Object.keys(attemptsMap).sort((a, b) => a - b);

        if (attemptKeys.length === 0) {
            contentEl.innerHTML = `<div style="padding: 15px; background: #fff3cd; color: #856404; border-radius: 5px;">Aucune tentative terminée n'a été trouvée pour cette épreuve.</div>`;
            return;
        }

        // Cartes résumé des moyennes globales par tentative
        let summaryHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 25px;">`;

        attemptKeys.forEach(attNum => {
            const stats = attemptsMap[attNum];
            const avg20 = stats.totalMax > 0 ? (stats.totalPoints / stats.totalMax) * 20 : 0;
            summaryHtml += `
                <div style="background: #f8f9fa; border-left: 4px solid #0f4c81; padding: 15px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="font-size: 0.85rem; color: #6c757d; font-weight: 700; text-transform: uppercase;">Tentative ${attNum}</div>
                    <div style="font-size: 2rem; font-weight: 700; color: #0f4c81; margin: 4px 0;">${avg20.toFixed(2)} <span style="font-size: 1.1rem; color: #495057;">/ 20</span></div>
                    <div style="font-size: 0.8rem; color: #6c757d;">${stats.totalPoints.toFixed(2)} / ${stats.totalMax} pts (${stats.count} épreuves)</div>
                </div>
            `;
        });
        summaryHtml += `</div>`;

        // Tableau détaillé
        let tableHtml = `
            <h5 style="margin-bottom: 12px; font-weight: 600; color: #333;">Détail dossier par dossier</h5>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f1f4f8; border-bottom: 2px solid #dee2e6; text-align: left;">
                        <th style="padding: 10px;">Dossier</th>
                        <th style="padding: 10px; text-align: center;">Nb Questions</th>
                        ${attemptKeys.map(k => `<th style="padding: 10px; text-align: center;">Tentative ${k}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        results.forEach(res => {
            tableHtml += `
                <tr style="border-bottom: 1px solid #e9ecef;">
                    <td style="padding: 10px;"><strong>${res.name}</strong></td>
                    <td style="padding: 10px; text-align: center;">${res.questions || '-'}</td>
            `;

            attemptKeys.forEach(k => {
                const att = res.attempts.find(a => a.attempt == k);
                if (att) {
                    tableHtml += `
                        <td style="padding: 10px; text-align: center;">
                            <strong style="color: #0f4c81;">${att.note.toFixed(2)}</strong> / 20
                            <br><small style="color: #6c757d;">(${att.points}/${res.questions} pts)</small>
                        </td>`;
                } else {
                    tableHtml += `<td style="padding: 10px; text-align: center; color: #adb5bd;">-</td>`;
                }
            });

            tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table>`;
        contentEl.innerHTML = summaryHtml + tableHtml;
    }

    // Initialisation du bouton au chargement
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', createFloatingButton);
    } else {
        createFloatingButton();
    }
})();
