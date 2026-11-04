# -*- coding: utf-8 -*-
"""Génère LABIDI_ProjetWazuh.docx (python-docx). Conversion PDF : soffice --headless --convert-to pdf"""
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ICI = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(ICI, "captures")
BLEU = RGBColor(0x1F, 0x3A, 0x5F)
GRIS = RGBColor(0x55, 0x55, 0x55)

doc = Document()
sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21)
sec.left_margin = sec.right_margin = Cm(2.2)
sec.top_margin, sec.bottom_margin = Cm(2), Cm(2)
sec.different_first_page_header_footer = True

st = doc.styles["Normal"]
st.font.name = "Calibri"
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
st.font.size = Pt(10.5)
st.paragraph_format.space_after = Pt(4)
st.paragraph_format.line_spacing = 1.1
for niv, taille in ((1, 15), (2, 12)):
    h = doc.styles[f"Heading {niv}"]
    h.font.name = "Calibri"
    rf = h.element.rPr.rFonts
    for a in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        if rf.get(qn(a)) is not None:
            del rf.attrib[qn(a)]
    rf.set(qn("w:ascii"), "Calibri"); rf.set(qn("w:hAnsi"), "Calibri")
    h.font.size = Pt(taille)
    h.font.bold = True
    h.font.color.rgb = BLEU
    h.paragraph_format.space_before = Pt(14 if niv == 1 else 9)
    h.paragraph_format.space_after = Pt(5)
    h.paragraph_format.keep_with_next = True


# ---------- utilitaires ----------
def ombrer(cell, couleur):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), couleur)
    tcPr.append(shd)


def bordures(cell, couleur, gauche_epais=False, style="single"):
    tcPr = cell._tc.get_or_add_tcPr()
    b = OxmlElement("w:tcBorders")
    for cote in ("top", "left", "bottom", "right"):
        e = OxmlElement(f"w:{cote}")
        e.set(qn("w:val"), style)
        e.set(qn("w:sz"), "24" if (gauche_epais and cote == "left") else "6")
        e.set(qn("w:color"), couleur)
        b.append(e)
    tcPr.append(b)


def marges_cellule(cell, cm=0.25):
    tcPr = cell._tc.get_or_add_tcPr()
    m = OxmlElement("w:tcMar")
    for cote in ("top", "left", "bottom", "right"):
        e = OxmlElement(f"w:{cote}")
        e.set(qn("w:w"), str(int(cm * 567 * (0.5 if cote in ("top", "bottom") else 1))))
        e.set(qn("w:type"), "dxa")
        m.append(e)
    tcPr.append(m)


def espace(pt=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = Pt(pt)


def runs_riches(p, texte, taille=None):
    """**gras** et `code` en ligne."""
    import re
    for morceau in re.split(r"(\*\*.+?\*\*|`.+?`)", texte):
        if not morceau:
            continue
        if morceau.startswith("**"):
            r = p.add_run(morceau[2:-2]); r.bold = True
        elif morceau.startswith("`"):
            r = p.add_run(morceau[1:-1]); r.font.name = "Consolas"
            r.font.size = Pt((taille or 10.5) - 1)
        else:
            r = p.add_run(morceau)
        if taille and not morceau.startswith("`"):
            r.font.size = Pt(taille)
    return p


def para(texte, **kw):
    return runs_riches(doc.add_paragraph(), texte, **kw)


def puces(items):
    for it in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(2)
        runs_riches(p, it)


NUM = [0]


def etapes(items):
    for it in items:
        NUM[0] += 1
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(f"Étape {NUM[0]} — "); r.bold = True; r.font.color.rgb = BLEU
        runs_riches(p, it)


def code(texte, titre=None):
    if titre:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(titre); r.italic = True; r.font.size = Pt(9); r.font.color.rgb = GRIS
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.cell(0, 0)
    ombrer(c, "F2F2F2"); bordures(c, "D0D0D0"); marges_cellule(c); insecable(t)
    c.paragraphs[0].text = ""
    lignes = texte.strip("\n").split("\n")
    for i, l in enumerate(lignes):
        p = c.paragraphs[0] if i == 0 else c.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(l if l else " ")
        r.font.name = "Consolas"; r._element.rPr.rFonts.set(qn("w:hAnsi"), "Consolas")
        r.font.size = Pt(8.5)
    espace(6)


def encadre(texte, genre="vert", titre=None):
    fond, bord, coul_titre = {
        "vert": ("E8F5E9", "2E7D32", RGBColor(0x1B, 0x5E, 0x20)),
        "orange": ("FFF3E0", "E65100", RGBColor(0xBF, 0x36, 0x0C)),
    }[genre]
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.cell(0, 0)
    ombrer(c, fond); bordures(c, bord, gauche_epais=True); marges_cellule(c, 0.3); insecable(t)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    if titre:
        r = p.add_run(titre + " "); r.bold = True; r.font.color.rgb = coul_titre; r.font.size = Pt(10)
    items = texte if isinstance(texte, list) else [texte]
    for i, it in enumerate(items):
        if i > 0:
            p = c.add_paragraph(); p.paragraph_format.space_after = Pt(2)
        runs_riches(p, it, taille=10)
    espace(6)


def capture_a_inserer(description):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.cell(0, 0)
    ombrer(c, "FAFAFA"); bordures(c, "9E9E9E", style="dashed"); marges_cellule(c, 0.3); insecable(t)
    p = c.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10); p.paragraph_format.space_after = Pt(2)
    r = p.add_run("[ Capture à insérer ]"); r.bold = True; r.font.color.rgb = GRIS
    p2 = c.add_paragraph(); p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_after = Pt(10)
    r = p2.add_run(description); r.italic = True; r.font.size = Pt(9.5); r.font.color.rgb = GRIS
    espace(6)


def image(fichier, legende, largeur_cm=15.5):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(os.path.join(CAP, fichier), width=Cm(largeur_cm))
    lp = doc.add_paragraph(); lp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    lp.paragraph_format.space_after = Pt(8)
    r = lp.add_run(legende); r.italic = True; r.font.size = Pt(9); r.font.color.rgb = GRIS


def tableau(entetes, lignes, largeurs=None):
    t = doc.add_table(rows=1, cols=len(entetes))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(entetes):
        c = t.rows[0].cells[i]
        ombrer(c, "1F3A5F")
        c.paragraphs[0].text = ""
        r = c.paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for j, ligne in enumerate(lignes):
        cells = t.add_row().cells
        for i, v in enumerate(ligne):
            if j % 2 == 1:
                ombrer(cells[i], "F4F6F9")
            p = cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            runs_riches(p, v, taille=9.5)
    # répète l'en-tête
    trPr = t.rows[0]._tr.get_or_add_trPr()
    th = OxmlElement("w:tblHeader"); th.set(qn("w:val"), "true"); trPr.append(th)
    if largeurs:
        fixer_largeurs(t, largeurs)
    insecable(t)
    espace(8)


def fixer_largeurs(t, largeurs):
    t.autofit = False
    tblPr = t._tbl.tblPr
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
    for i, gc in enumerate(t._tbl.tblGrid.findall(qn("w:gridCol"))):
        gc.set(qn("w:w"), str(int(largeurs[i] * 567)))
    for row in t.rows:
        for i, w in enumerate(largeurs):
            row.cells[i].width = Cm(w)


def insecable(t):
    for row in t.rows:
        trPr = row._tr.get_or_add_trPr()
        e = OxmlElement("w:cantSplit"); e.set(qn("w:val"), "true"); trPr.append(e)


def titre(texte, niveau=1):
    if niveau == 1:
        NUM[0] = 0
    doc.add_heading(texte, level=niveau)


def champ_page(p):
    for typ, txt in (("begin", None), (None, "PAGE"), ("end", None)):
        r = p.add_run()
        if typ:
            f = OxmlElement("w:fldChar"); f.set(qn("w:fldCharType"), typ); r._r.append(f)
        else:
            it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = txt; r._r.append(it)


# ---------- en-tête / pied ----------
hp = sec.header.paragraphs[0]
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r = hp.add_run("LABIDI Amal — Projet Wazuh — B2 Sécurité Pratique"); r.font.size = Pt(8.5); r.font.color.rgb = GRIS
fp = sec.footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = fp.add_run("Page "); r.font.size = Pt(8.5); r.font.color.rgb = GRIS
champ_page(fp)

# ---------- page de garde ----------
for _ in range(5):
    espace(18)
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("B2 SÉCURITÉ PRATIQUE"); r.bold = True; r.font.size = Pt(12); r.font.color.rgb = GRIS
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(18)
r = p.add_run("Dossier technique"); r.font.size = Pt(16); r.font.color.rgb = BLEU
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("Détection d’intrusions avec Wazuh"); r.bold = True; r.font.size = Pt(26); r.font.color.rgb = BLEU
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(30)
r = p.add_run("Déni de service HTTP · Injection SQL · Balayage de ports")
r.font.size = Pt(13); r.font.color.rgb = GRIS

t = doc.add_table(rows=0, cols=2); t.alignment = WD_TABLE_ALIGNMENT.CENTER
for k, v in (("Étudiante", "Amal LABIDI"), ("Module", "B2 Sécurité Pratique — TP1 / TP2"),
             ("Plateforme", "Wazuh 4.14 (manager + dashboard), Debian"),
             ("Techniques MITRE", "T1499 · T1190 · T1046"),
             ("Année", "2026-2027"), ("Date", "Novembre 2026")):
    c = t.add_row().cells
    c[0].width, c[1].width = Cm(4.5), Cm(8)
    r = c[0].paragraphs[0].add_run(k); r.bold = True; r.font.color.rgb = BLEU
    c[1].paragraphs[0].add_run(v)
    for cc in c:
        cc.paragraphs[0].paragraph_format.space_after = Pt(3)
fixer_largeurs(t, [4.5, 8])
doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

# ---------- 1 ----------
titre("1. Contexte et objectif")
para("À partir de la plateforme Wazuh installée lors des TP1 et TP2, l’objectif est de mettre en œuvre "
     "**trois détections d’intrusion** : configurer l’agent et/ou le serveur, déclencher l’attaque depuis "
     "une machine de test, puis analyser l’alerte dans le dashboard. Une **réponse active** est ajoutée "
     "lorsqu’elle est pertinente (DoS).")
tableau(["#", "Détection", "MITRE ATT&CK", "Source des logs", "Règles", "Réponse active"], [
    ["1", "Déni de service HTTP", "T1499 Endpoint DoS", "Apache access.log", "100200 → 100201 (perso)", "Oui (firewall-drop)"],
    ["2", "Injection SQL", "T1190 Exploit Public-Facing App.", "Apache access.log", "31103 / 31106 (natives)", "Non"],
    ["3", "Balayage de ports Nmap", "T1046 Network Service Discovery", "iptables → kern.log", "100300 → 100301 (perso)", "Non"],
], [0.7, 3.2, 3.4, 3, 3.3, 2.4])
encadre(["Tous les tests sont réalisés **uniquement sur mes machines de laboratoire**, dans un **réseau isolé**.",
         "Accéder ou se maintenir frauduleusement dans un système de traitement automatisé de données est un délit "
         "(**art. 323-1 du Code pénal** : 3 ans d’emprisonnement et 100 000 € d’amende). Entraver son "
         "fonctionnement, comme le fait un DoS, est puni par l’art. 323-2. Ces outils (ab, nmap, curl) ne "
         "doivent jamais viser une cible sans autorisation écrite."], "orange", "Cadre légal —")

# ---------- 2 ----------
titre("2. Schéma d’architecture")
para("Trois machines virtuelles Debian sont reliées sur le même réseau privé isolé `192.168.213.0/24` (sans accès Internet).")
tableau(["Machine", "Rôle", "Adresse IP", "Logiciels"], [
    ["Serveur Wazuh", "Manager + indexer + dashboard : analyse, règles, alertes", "192.168.213.157", "wazuh-manager, dashboard"],
    ["Agent « client1 » (ID 003)", "Victime : serveur web, collecte des logs", "192.168.213.134", "Apache 2.4, wazuh-agent 4.14.9, iptables, rsyslog"],
    ["Attaquante", "Machine de test", "192.168.213.159", "ab (ApacheBench), curl, nmap 7.93"],
], [3.6, 5.6, 3, 4.2])
code("""   [ Attaquante ]  ----- HTTP / scan ----->  [ Agent client1 (Apache) ]
   192.168.213.159                            192.168.213.134
                                                    |  logs (1514/tcp)
                                                    v
                                          [ Serveur Wazuh + Dashboard ]
                                              192.168.213.157""", "Flux simplifié")
capture_a_inserer("Schéma réseau (3 VM, IP, flux d’attaque et remontée des logs vers le manager)")

# ---------- 3 ----------
titre("3. Préparation du lab")
puces(["**Snapshots** des trois VM avant chaque test : retour rapide à un état propre en cas d’erreur de configuration.",
       "**Réseau isolé** (host-only) : aucune attaque ne peut sortir du lab. Un NAT temporaire a seulement servi "
       "à installer les paquets (voir §8).",
       "**Vérification de l’agent** depuis le serveur : l’agent doit être « Active »."])
code("""# Sur le serveur Wazuh
/var/ossec/bin/agent_control -l
#   ID: 003, Name: client1, IP: 192.168.213.134, Active

# Savoir si l'on est sur le serveur ou sur l'agent
/var/ossec/bin/wazuh-control info | grep type""")
encadre(["**L’agent collecte, le serveur décide.** Les blocs `<localfile>` (quels fichiers lire) se configurent "
         "dans `/var/ossec/etc/ossec.conf` de l’**agent**. Les règles (`local_rules.xml`) et la réponse active "
         "se configurent sur le **serveur**.",
         "Avant chaque redémarrage du manager : `/var/ossec/bin/wazuh-analysisd -t` (test de syntaxe), puis "
         "`wazuh-logtest` pour valider une règle sur une ligne de log."], "vert", "Règle d’or —")

# ---------- 4 ----------
titre("4. Détection 1 — Déni de service HTTP (MITRE T1499)")
titre("4.1 Explication de l’attaque", 2)
para("Un déni de service applicatif consiste à envoyer un très grand nombre de requêtes HTTP pour saturer le serveur "
     "web et le rendre indisponible (MITRE **T1499 — Endpoint Denial of Service**, sous-technique T1499.002 "
     "Service Exhaustion Flood). Chaque requête isolée est légitime : c’est la **fréquence** depuis une même IP qui "
     "révèle l’attaque. Wazuh ne la détecte pas nativement : il faut une règle de corrélation.")
titre("4.2 Procédure pas à pas", 2)
etapes(["**Agent** — faire lire le journal Apache à l’agent, puis `systemctl restart wazuh-agent` :"])
code("""<localfile>
  <log_format>apache</log_format>
  <location>/var/log/apache2/access.log</location>
</localfile>""", "Agent — /var/ossec/etc/ossec.conf")
etapes(["**Serveur** — ajouter deux règles : 100200 « marque » chaque requête simple, 100201 se déclenche "
        "quand 100200 est vue 100 fois en 10 s depuis la même IP source :"])
code("""<group name="local,web,dos,">
  <rule id="100200" level="3">
    <if_sid>31108</if_sid>
    <description>Requete web recue (base flood)</description>
  </rule>

  <rule id="100201" level="10" frequency="100" timeframe="10">
    <if_matched_sid>100200</if_matched_sid>
    <same_source_ip />
    <description>DoS HTTP : plus de 100 requetes en 10 s depuis $(srcip)</description>
    <mitre>
      <id>T1499</id>
    </mitre>
  </rule>
</group>""", "Serveur — /var/ossec/etc/rules/local_rules.xml")
etapes(["**Serveur** — réponse active : bloquer l’IP source sur l’agent pendant 180 s quand 100201 se déclenche :"])
code("""<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>100201</rules_id>
  <timeout>180</timeout>
</active-response>""", "Serveur — /var/ossec/etc/ossec.conf")
etapes(["**Serveur** — valider et appliquer :"])
code("""/var/ossec/bin/wazuh-analysisd -t
systemctl restart wazuh-manager
grep -n "100200" /var/ossec/etc/rules/local_rules.xml""")
image("dos_regle_chargee.png", "Figure 1 — Manager redémarré, règle 100200 présente dans local_rules.xml", 11)

titre("4.3 Avant l’attaque", 2)
para("Une requête unique (`curl`) est décodée par `web-accesslog` et tombe sur la règle native **31108** "
     "(niveau 0, « Ignored URLs ») : aucune alerte, comportement normal.")
image("dos_avant_logtest.png", "Figure 2 — Avant : wazuh-logtest sur une requête simple → règle 31108, niveau 0", 12)

titre("4.4 Pendant l’attaque", 2)
code("""# Attaquante : 5000 requêtes, 100 en parallèle
ab -n 5000 -c 100 http://192.168.213.134/

# Serveur : suivi des alertes en direct
tail -f /var/ossec/logs/alerts/alerts.log | grep -E "100200|100201\"""")
image("dos_pendant_ab.png", "Figure 3 — Pendant : ab en cours, les alertes 100200 défilent sur le serveur", 13)
image("dos_surveillance_alerts.png", "Figure 4 — Commande de surveillance des alertes 100200 / 100201", 13)

titre("4.5 Après l’attaque", 2)
image("dos_apres_dashboard.png", "Figure 5 — Après : pic d’environ 4 400 événements sur l’agent client1 vers 15 h", 15.5)
capture_a_inserer("Alerte 651 « Host Blocked by firewall-drop Active Response » dans le dashboard "
                  "+ sortie de iptables -L INPUT -n sur l’agent montrant le DROP de 192.168.213.159")
code("""# Agent : preuve du blocage (puis disparition après 180 s)
iptables -L INPUT -n | grep 192.168.213.159
# DROP  all  --  192.168.213.159  0.0.0.0/0""")

titre("4.6 Analyse de l’alerte", 2)
tableau(["Champ", "Valeur"], [
    ["rule.id / level", "100201 / 10"],
    ["rule.description", "DoS HTTP : plus de 100 requêtes en 10 s depuis 192.168.213.159"],
    ["rule.mitre.id", "T1499 (Impact)"],
    ["data.srcip", "192.168.213.159"],
    ["agent.name / ip", "client1 / 192.168.213.134"],
    ["rule.frequency / firedtimes", "100 / s’incrémente tant que le flood dure"],
], [5, 11])
encadre("Le flood génère des milliers d’alertes 100200 (niveau 3, simple comptage), puis 100201 (niveau 10) une fois "
        "le seuil franchi. 100201 déclenche `firewall-drop`, qui ajoute une règle DROP sur l’agent ; la règle **651** "
        "confirme le blocage. Après le timeout, l’IP est automatiquement débloquée.", "vert", "À retenir —")
titre("4.7 Limites", 2)
puces(["La règle 31108 ne couvre que les requêtes « simples » (ex. `GET /`) : un flood sur d’autres URL ou en POST n’est pas compté.",
       "Seuil fixe : un pic légitime (NAT d’entreprise, proxy) peut créer un **faux positif** et bloquer des utilisateurs.",
       "Un **DDoS** réparti sur de nombreuses IP passe sous le seuil `same_source_ip`.",
       "Les centaines d’alertes 100200 de niveau 3 polluent l’index : passer 100200 en niveau 0 en production."])

# ---------- 5 ----------
titre("5. Détection 2 — Injection SQL (MITRE T1190)")
titre("5.1 Explication de l’attaque", 2)
para("L’injection SQL consiste à insérer du code SQL dans un paramètre (ici `id`) pour que l’application l’exécute "
     "sur sa base de données : lecture de tables, contournement d’authentification… C’est une exploitation "
     "d’application exposée (MITRE **T1190 — Exploit Public-Facing Application**).")
titre("5.2 Procédure pas à pas", 2)
etapes(["**Aucune configuration supplémentaire** : l’agent lit déjà `access.log` (détection 1) et Wazuh fournit les "
        "règles natives `0245-web_rules.xml`.",
        "**Attaquante** — envoyer une requête contenant un motif SQL :"])
code('curl -XGET "http://192.168.213.134/users/?id=SELECT+*+FROM+users"')
etapes(["**Dashboard** — Threat Hunting, filtre `rule.id:31103` sur l’agent 003."])
capture_a_inserer("Pendant : la commande curl et la réponse 404 Not Found d’Apache 2.4.69")
capture_a_inserer("Après : Threat Hunting rule.id:31103 (1 alerte, niveau 7, groupes web / attack / sql_injection)")
titre("5.3 Analyse de l’alerte", 2)
tableau(["Champ", "Valeur"], [
    ["rule.id / level", "31103 / 7"],
    ["rule.description", "SQL injection attempt."],
    ["rule.groups", "web, accesslog, attack, sql_injection"],
    ["rule.mitre.id", "T1190 (Initial Access)"],
    ["data.url / data.id", "/users/?id=SELECT+*+FROM+users / 404"],
    ["data.srcip", "192.168.213.159"],
], [5, 11])
encadre(["La règle 31103 cherche des motifs SQL (`select+`, `union+`, `%20from%20`…) dans l’URL décodée par `web-accesslog`.",
         "La règle **31106** (niveau 12, « A web attack returned code 200 ») ne se déclenche que si le serveur répond **200**. "
         "Ici Apache a répondu **404** (page inexistante) : l’attaque est détectée mais a **échoué**, d’où "
         "0 alerte de niveau ≥ 12 dans le dashboard. C’est la bonne lecture : tentative, pas compromission."],
        "vert", "À retenir —")
titre("5.4 Limites", 2)
puces(["Détection par motifs : un encodage différent (`%53ELECT`, commentaires `/**/`, casse mixte) peut contourner la règle.",
       "Les requêtes **POST** ne figurent pas dans `access.log` : leur corps n’est pas analysé.",
       "Faux positifs possibles sur des recherches légitimes contenant « select » ou « union ».",
       "Pas de réponse active : bloquer sur une seule requête serait trop agressif (amélioration : bloquer sur 31106 ou après N tentatives)."])

# ---------- 6 ----------
titre("6. Détection 3 — Balayage de ports Nmap (MITRE T1046)")
titre("6.1 Explication de l’attaque", 2)
para("Le balayage de ports est une phase de reconnaissance : l’attaquant teste de nombreux ports pour découvrir les "
     "services exposés (MITRE **T1046 — Network Service Discovery**). Un scan `-sT` ouvre une connexion TCP complète "
     "sur chaque port. Apache ne voit rien : il faut journaliser les paquets au niveau du **pare-feu** de l’agent.")
titre("6.2 Procédure pas à pas", 2)
etapes(["**Agent** — installer les outils et journaliser chaque SYN entrant :"])
code("""apt install iptables rsyslog
iptables -I INPUT -p tcp --syn -j LOG --log-prefix "SCAN-DETECT: " --log-level 4
tail -n 20 /var/log/kern.log | grep SCAN-DETECT""", "Agent")
etapes(["**Agent** — faire lire `kern.log` à l’agent, puis `systemctl restart wazuh-agent` :"])
code("""<localfile>
  <log_format>syslog</log_format>
  <location>/var/log/kern.log</location>
</localfile>""", "Agent — /var/ossec/etc/ossec.conf")
etapes(["**Serveur** — règles de corrélation (15 SYN en 5 s depuis la même IP), puis `wazuh-analysisd -t` et redémarrage :"])
code("""<group name="local,scan,">
  <rule id="100300" level="3">
    <if_sid>4100</if_sid>
    <match>SCAN-DETECT</match>
    <description>Connexion TCP SYN journalisee par iptables</description>
  </rule>

  <rule id="100301" level="10" frequency="15" timeframe="5">
    <if_matched_sid>100300</if_matched_sid>
    <same_source_ip />
    <description>Scan de ports : plus de 15 SYN en 5 s depuis $(srcip)</description>
    <mitre>
      <id>T1046</id>
    </mitre>
  </rule>
</group>""", "Serveur — /var/ossec/etc/rules/local_rules.xml")
etapes(["**Attaquante** — lancer le scan :"])
code("nmap -sT -p 1-1000 192.168.213.134\n# 22/tcp open ssh, 80/tcp open http, 998 ports fermés (0,24 s)")
capture_a_inserer("Avant : recherche rule.id:100301 → « No results match your search criteria »")
capture_a_inserer("Pendant : sortie de nmap -sT -p 1-1000 (22/ssh et 80/http ouverts)")
capture_a_inserer("Après : alerte 100301 dans le dashboard (srcip 192.168.213.159, T1046)")
titre("6.3 Analyse de l’alerte", 2)
tableau(["Champ", "Valeur"], [
    ["rule.id / level", "100301 / 10"],
    ["rule.description", "Scan de ports : plus de 15 SYN en 5 s depuis 192.168.213.159"],
    ["rule.mitre.id", "T1046 (Discovery)"],
    ["decoder.name", "kernel / iptables (SRC, DST, DPT extraits)"],
    ["data.srcip / data.dstport", "192.168.213.159 / port testé"],
], [5, 11])
encadre("Le décodeur iptables natif extrait `srcip` et `dstport` de la ligne kern.log ; la règle native **4100** "
        "(groupe firewall) l’attrape d’abord. 100300 en est un enfant (`if_sid 4100`) filtré sur notre préfixe, et "
        "100301 corrèle la fréquence par IP source. 1000 ports scannés en 0,24 s dépassent très largement le seuil.",
        "vert", "À retenir —")
titre("6.4 Limites", 2)
puces(["Un scan **lent** (`nmap -T1`, ou réparti dans le temps) reste sous 15 SYN / 5 s.",
       "Un scan **UDP** ou furtif (`-sF`, `-sN`, `-sX`) n’envoie pas de SYN et échappe à la règle iptables.",
       "La règle LOG journalise aussi le trafic légitime (SSH, HTTP) : volume important de kern.log.",
       "Pas de réponse active : un blocage pourrait toucher un scanner de vulnérabilités autorisé."])

# ---------- 7 ----------
titre("7. Analyse des alertes")
tableau(["Règle", "Niveau", "Description", "Déclencheur", "MITRE", "Réponse"], [
    ["100201", "10", "DoS HTTP", "≥ 100 requêtes simples / 10 s, même IP", "T1499", "firewall-drop 180 s"],
    ["31103", "7", "SQL injection attempt", "Motif SQL dans l’URL", "T1190", "—"],
    ["31106", "12", "Web attack returned code 200", "31103 + réponse 200 (non atteint : 404)", "T1190", "—"],
    ["100301", "10", "Scan de ports", "≥ 15 SYN / 5 s, même IP", "T1046", "—"],
    ["651", "3", "Host Blocked by firewall-drop", "Exécution de la réponse active", "—", "Preuve du blocage"],
], [1.6, 1.4, 3.9, 4.6, 1.6, 3])
para("Dans le dashboard, sur 24 h : environ **4 400 événements** concentrés autour de 15 h (flood), **0 alerte de "
     "niveau ≥ 12** (aucune attaque n’a réussi) et des tactiques MITRE cohérentes (Initial Access pour l’injection, "
     "Impact pour le DoS, Discovery pour le scan).")

# ---------- 8 ----------
titre("8. Difficultés rencontrées et solutions")
tableau(["Difficulté", "Cause / symptôme", "Solution"], [
    ["Pas d’Internet", "Réseau isolé : `apt install` impossible", "NAT temporaire pour installer les paquets, puis retour en réseau isolé"],
    ["Confusion agent / serveur", "Configs appliquées sur la mauvaise machine", "`wazuh-control info | grep type` avant chaque modification"],
    ["Règle DoS ignorée", "`web-accesslog` est un **décodeur**, pas un groupe : `if_group` ne matchait rien", "Hériter de la règle native : `if_sid 31108`"],
    ["Logs non remontés", "Agent pas rechargé après l’ajout du `<localfile>`", "`systemctl restart wazuh-agent`"],
    ["Manager planté", "Décodeur « iptables » personnalisé inexistant + IDs de règles en double", "`wazuh-analysisd -t` systématiquement avant de redémarrer"],
    ["kern.log absent", "Debian utilise journald, pas rsyslog", "`apt install rsyslog`"],
    ["Règle scan sans résultat", "La règle native 4100 gagnait (`rule.id:100301` vide)", "`if_sid 4100` + niveau 3 sur 100300"],
], [3.4, 6, 6.6])

# ---------- 9 ----------
titre("9. Limites et améliorations")
puces(["**Seuils fixes** → les ajuster après observation du trafic normal (baseline), ou utiliser une liste blanche (CDB list) d’IP de confiance.",
       "**Contournements** (DDoS distribué, scan lent, encodage SQL) → compléter par un WAF (ModSecurity) et un IDS réseau (Suricata) dont Wazuh lit les logs.",
       "**Réponse active** → l’étendre au scan et à 31106 avec un timeout progressif, en excluant le serveur Wazuh et l’admin.",
       "**Bruit** → passer les règles de comptage (100200, 100300) en niveau 0 pour ne garder que les alertes de corrélation.",
       "**Alerting** → notification e-mail / Slack sur les niveaux ≥ 10."])

# ---------- 10 ----------
titre("10. Conclusion")
para("Les trois détections fonctionnent sur le lab : le **DoS HTTP** est détecté par corrélation et bloqué "
     "automatiquement (100201 → 651), l’**injection SQL** est reconnue par les règles natives (31103) avec une "
     "analyse correcte de son échec (404, pas de 31106), et le **balayage de ports** est rendu visible grâce à la "
     "journalisation iptables (100301). Le projet m’a surtout appris à distinguer le rôle de l’agent (collecte) et du "
     "serveur (règles), à comprendre la chaîne décodeur → règle → corrélation, et à tester systématiquement "
     "(`wazuh-logtest`, `wazuh-analysisd -t`) avant de redémarrer.")

# ---------- 11 ----------
titre("11. Sources")
puces(["Documentation Wazuh — Rules syntax : https://documentation.wazuh.com/current/user-manual/ruleset/ruleset-xml-syntax/rules.html",
       "Documentation Wazuh — Active response : https://documentation.wazuh.com/current/user-manual/capabilities/active-response/",
       "Documentation Wazuh — wazuh-logtest : https://documentation.wazuh.com/current/user-manual/reference/tools/wazuh-logtest.html",
       "Règles natives Wazuh : 0245-web_rules.xml (31103, 31106, 31108), règles firewall (4100), 0015-ossec_rules.xml (651)",
       "MITRE ATT&CK — T1499, T1190, T1046 : https://attack.mitre.org/techniques/",
       "Code pénal, art. 323-1 et 323-2 : https://www.legifrance.gouv.fr",
       "Nmap Reference Guide : https://nmap.org/book/man.html — ApacheBench : https://httpd.apache.org/docs/2.4/programs/ab.html",
       "Sujet « B2 Sécurité Pratique — Détection », A. Lopez, 2026-2027"])

out = os.path.join(ICI, "LABIDI_ProjetWazuh.docx")
doc.save(out)
print("OK", out)
