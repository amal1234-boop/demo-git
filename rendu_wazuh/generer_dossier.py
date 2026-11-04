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
sec.left_margin, sec.right_margin = Cm(2.5), Cm(2.3)
sec.top_margin, sec.bottom_margin = Cm(2), Cm(2.2)
sec.footer_distance = Cm(0.8)

st = doc.styles["Normal"]
st.font.name = "Calibri"
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
st.font.size = Pt(11)
st.paragraph_format.space_after = Pt(6)
st.paragraph_format.line_spacing = 1.08
for niv, taille in ((1, 13), (2, 12)):
    h = doc.styles[f"Heading {niv}"]
    h.font.name = "Calibri"
    rf = h.element.rPr.rFonts
    for a in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        if rf.get(qn(a)) is not None:
            del rf.attrib[qn(a)]
    rf.set(qn("w:ascii"), "Calibri"); rf.set(qn("w:hAnsi"), "Calibri")
    h.font.size = Pt(taille)
    h.font.bold = True
    h.font.color.rgb = RGBColor(0, 0, 0)
    h.font.underline = True
    h.paragraph_format.space_before = Pt(18 if niv == 1 else 12)
    h.paragraph_format.space_after = Pt(8)
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
            r = p.add_run(morceau[1:-1])
        else:
            r = p.add_run(morceau)
        if taille:
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
        r = p.add_run(f"Étape {NUM[0]} : "); r.bold = True
        runs_riches(p, it)


def code(texte, titre=None):
    if not texte.lstrip().startswith("<") and titre != "Flux simplifié":
        return commandes(texte, titre)
    if titre:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(titre); r.italic = True; r.font.size = Pt(9); r.font.color.rgb = GRIS
    lignes = texte.strip("\n").split("\n")
    for i, l in enumerate(lignes):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6 if i == len(lignes) - 1 else 0)
        p.paragraph_format.keep_with_next = i < len(lignes) - 1
        retrait = len(l) - len(l.lstrip(" "))
        p.paragraph_format.left_indent = Cm(0.35 * retrait)
        p.add_run(l.strip())


def commandes(texte, titre=None):
    if titre:
        p = doc.add_paragraph(); p.paragraph_format.keep_with_next = True
        r = p.add_run(titre); r.italic = True
    lignes = [l for l in texte.strip("\n").split("\n") if l.strip()]
    for i, l in enumerate(lignes):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6 if i == len(lignes) - 1 else 0)
        p.paragraph_format.keep_with_next = i < len(lignes) - 1
        if l.startswith("#"):
            r = p.add_run(l.lstrip("# ").strip()); r.italic = True; r.font.color.rgb = GRIS
            r.font.size = Pt(10)
        else:
            r = p.add_run("# " + l); r.bold = True


def encadre(texte, genre="vert", titre=None):
    if genre == "vert":
        items = texte if isinstance(texte, list) else [texte]
        for i, it in enumerate(items):
            p = doc.add_paragraph()
            if i == 0 and titre:
                r = p.add_run(titre.rstrip(" —") + " : "); r.bold = True; r.underline = True
            runs_riches(p, it)
        return
    fond, bord, coul_titre = {
        "vert": ("E8F5E9", "2E7D32", RGBColor(0x1B, 0x5E, 0x20)),
        "orange": ("FFFFFF", "C00000", RGBColor(0xC0, 0x00, 0x00)),
    }[genre]
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.cell(0, 0)
    ombrer(c, fond); bordures(c, bord); marges_cellule(c, 0.3); insecable(t)
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
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_after = Pt(2)
    p.add_run().add_picture(os.path.join(CAP, fichier), width=Cm(largeur_cm))
    lp = doc.add_paragraph()
    lp.paragraph_format.space_after = Pt(8)
    if not legende:
        p.paragraph_format.space_after = Pt(8); lp._p.getparent().remove(lp._p); return
    r = lp.add_run(legende); r.italic = True; r.font.size = Pt(9); r.font.color.rgb = GRIS


def tableau(entetes, lignes, largeurs=None):
    t = doc.add_table(rows=1, cols=len(entetes))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    for i, h in enumerate(entetes):
        c = t.rows[0].cells[i]
        ombrer(c, "D9D9D9")
        c.paragraphs[0].text = ""
        r = c.paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(9.5)
    for j, ligne in enumerate(lignes):
        cells = t.add_row().cells
        for i, v in enumerate(ligne):
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


# ---------- pied de page (modèle TP) ----------
def tabs(p, positions):
    pPr = p._p.get_or_add_pPr()
    tb = OxmlElement("w:tabs")
    for pos, val in positions:
        t = OxmlElement("w:tab"); t.set(qn("w:val"), val); t.set(qn("w:pos"), str(int(pos * 567))); tb.append(t)
    pPr.append(tb)


def filet_haut(p, couleur="4F81BD"):
    pPr = p._p.get_or_add_pPr()
    bd = OxmlElement("w:pBdr"); e = OxmlElement("w:top")
    e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "18"); e.set(qn("w:space"), "4"); e.set(qn("w:color"), couleur)
    bd.append(e); pPr.append(bd)


pn = sec.footer.paragraphs[0]; pn.alignment = WD_ALIGN_PARAGRAPH.RIGHT
champ_page(pn)

# ---------- titre (modèle TP) ----------
t = doc.add_table(rows=1, cols=1)
c = t.cell(0, 0); bordures(c, "000000")
p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_after = Pt(0)
r = p.add_run("Projet Wazuh – Détection d’intrusions"); r.bold = True; r.font.size = Pt(14)
fixer_largeurs(t, [16.2])
espace(6)
titre("Informations")
for k, v in (("Étudiante", "Amal LABIDI"), ("Module", "B2 Sécurité Pratique – TP1 / TP2"),
             ("Détections", "Déni de service HTTP (T1499), injection SQL (T1190), balayage de ports (T1046)"),
             ("Plateforme", "Wazuh 4.14 (manager + dashboard), machines Debian")):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(0)
    r = p.add_run(k + " : "); r.bold = True
    p.add_run(v)
espace(6)

# ---------- 1 ----------
titre("1. Contexte et objectif")
para("À partir de la plateforme Wazuh des TP1 et TP2, je mets en place **trois détections d’intrusion**. "
     "Pour chacune : configuration, attaque depuis la machine de test, puis lecture de l’alerte dans le dashboard.")
tableau(["Détection", "MITRE", "Règle d’alerte", "Réponse active"], [
    ["Déni de service HTTP", "T1499", "100201", "Oui (blocage IP)"],
    ["Injection SQL", "T1190", "31103 / 31106", "Non"],
    ["Balayage de ports Nmap", "T1046", "100301", "Non"],
], [5.5, 2.5, 4, 4])
encadre(["Tests réalisés **uniquement sur mes machines de laboratoire**, dans un **réseau isolé**.",
         "Accéder frauduleusement à un système d’information est un délit (**art. 323-1 et suivants du Code pénal**)."],
        "orange", "ATTENTION : cadre légal.")

# ---------- 2 ----------
titre("2. Schéma d’architecture")
tableau(["Machine", "Rôle", "Adresse IP"], [
    ["Serveur Wazuh", "Manager + dashboard (règles, alertes)", "192.168.213.157"],
    ["Agent client1", "Victime : Apache + agent Wazuh", "192.168.213.134"],
    ["Attaquante", "Lance ab, curl, nmap", "192.168.213.159"],
], [4, 8, 4])
image("schema_reseau.png", None, 15.5)

# ---------- 3 ----------
titre("3. Préparation du lab")
puces(["Snapshot des 3 VM avant les tests.",
       "Réseau isolé (host-only), sans accès Internet.",
       "**Règle d’or : l’agent collecte les logs, le serveur porte les règles.**"])
para("Vérifier que l’agent est connecté (sur le serveur) :")
code("/var/ossec/bin/agent_control -l")
image("agent_actif_100201.png", None, 13)

# ---------- 4 ----------
titre("4. Détection 1 : Déni de service HTTP (MITRE T1499)")
titre("Explication", 2)
para("L’attaquant envoie un très grand nombre de requêtes pour saturer le serveur web. "
     "On alerte quand une même IP dépasse **100 requêtes en 10 secondes**, puis on la bloque.")
titre("Procédure", 2)
etapes(["Sur l’agent, lire le journal Apache (`/var/ossec/etc/ossec.conf`) :"])
code("""<localfile>
  <log_format>apache</log_format>
  <location>/var/log/apache2/access.log</location>
</localfile>""")
etapes(["Sur le serveur, ajouter les règles (`/var/ossec/etc/rules/local_rules.xml`) :"])
code("""<group name="local,web,dos,">
  <rule id="100200" level="3">
    <if_sid>31108</if_sid>
    <description>Requete web recue (base flood)</description>
  </rule>
  <rule id="100201" level="10" frequency="100" timeframe="10">
    <if_matched_sid>100200</if_matched_sid>
    <same_source_ip />
    <description>DoS HTTP : plus de 100 requetes en 10 s</description>
    <mitre><id>T1499</id></mitre>
  </rule>
</group>""")
etapes(["Sur le serveur, activer la réponse active (`/var/ossec/etc/ossec.conf`) :"])
code("""<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>100201</rules_id>
  <timeout>180</timeout>
</active-response>""")
etapes(["Redémarrer le manager :"])
code("systemctl restart wazuh-manager")
image("dos_regle_chargee.png", None, 11)
titre("Avant", 2)
para("Une requête normale ne déclenche aucune alerte (règle 31108, niveau 0).")
image("dos_avant_logtest.png", None, 12)
titre("Pendant", 2)
etapes(["Depuis l’attaquante, lancer l’attaque :"])
code("ab -n 5000 -c 100 http://192.168.213.134/")
etapes(["Sur le serveur, suivre les alertes :"])
code('tail -f /var/ossec/logs/alerts/alerts.log | grep -E "100200|100201"')
image("dos_pendant_ab.png", None, 13)
titre("Après", 2)
image("dos_apres_dashboard.png", None, 15.5)
image("dos_apres_651.png", None, 15.5)
para("Vérifier le blocage sur l’agent :")
code("iptables -L INPUT -n | grep 192.168.213.159")
titre("Analyse", 2)
para("Règle **100201**, niveau **10**, MITRE **T1499**, IP source **192.168.213.159**. "
     "Après correction du doublon, **10 alertes 100201** ont été enregistrées. Elle déclenche `firewall-drop` : l’IP est bloquée 180 s (alerte **651**).")

# ---------- 5 ----------
titre("5. Détection 2 : Injection SQL (MITRE T1190)")
titre("Explication", 2)
para("L’attaquant place du code SQL dans un paramètre d’URL pour interroger la base de données. "
     "Wazuh le détecte **nativement** : aucune configuration à ajouter.")
titre("Procédure", 2)
etapes(["Depuis l’attaquante, envoyer la requête :"])
code('curl -XGET "http://192.168.213.134/users/?id=SELECT+*+FROM+users"')
image("sqli_pendant_curl.png", None, 14)
etapes(["Dans le dashboard (Threat Hunting), filtrer : `rule.id:31103`"])
image("sqli_apres_31103.png", None, 15.5)
titre("Analyse", 2)
para("Règle **31103** « SQL injection attempt », niveau **7**, MITRE **T1190**. "
     "La règle **31106** (niveau 12) ne s’est pas déclenchée car le serveur a répondu **404** : "
     "l’attaque est détectée mais n’a pas réussi.")

# ---------- 6 ----------
titre("6. Détection 3 : Balayage de ports Nmap (MITRE T1046)")
titre("Explication", 2)
para("L’attaquant teste de nombreux ports pour trouver les services ouverts. "
     "Le pare-feu de l’agent journalise chaque connexion ; on alerte au-delà de **15 en 5 secondes** depuis une même IP.")
titre("Procédure", 2)
etapes(["Sur l’agent, installer les outils et journaliser les connexions :"])
code("""apt install iptables rsyslog
iptables -I INPUT -p tcp --syn -j LOG --log-prefix "SCAN-DETECT: \"""")
etapes(["Sur l’agent, lire `kern.log` (`/var/ossec/etc/ossec.conf`), puis redémarrer l’agent :"])
code("""<localfile>
  <log_format>syslog</log_format>
  <location>/var/log/kern.log</location>
</localfile>""")
etapes(["Sur le serveur, ajouter les règles (`local_rules.xml`) puis redémarrer le manager :"])
code("""<group name="local,scan,">
  <rule id="100300" level="3">
    <if_sid>4100</if_sid>
    <match>SCAN-DETECT</match>
    <description>Connexion journalisee par iptables</description>
  </rule>
  <rule id="100301" level="10" frequency="15" timeframe="5">
    <if_matched_sid>100300</if_matched_sid>
    <same_source_ip />
    <description>Scan de ports detecte</description>
    <mitre><id>T1046</id></mitre>
  </rule>
</group>""")
titre("Pendant", 2)
etapes(["Depuis l’attaquante, lancer le scan :"])
code("nmap -sT -p 1-1000 192.168.213.134")
titre("Après", 2)
image("scan_apres_100301.png", None, 15.5)
titre("Analyse", 2)
para("Règle **100301**, niveau **10**, MITRE **T1046**, IP source **192.168.213.159**. "
     "1000 ports testés en 0,24 s : le seuil est dépassé immédiatement.")

# ---------- 7 ----------
titre("7. Analyse des alertes")
tableau(["Règle", "Niveau", "Signification", "MITRE"], [
    ["100201", "10", "DoS HTTP : > 100 requêtes / 10 s", "T1499"],
    ["31103 / 31106", "7 / 12", "Tentative d’injection SQL / attaque réussie (code 200)", "T1190"],
    ["100301", "10", "Scan de ports : > 15 connexions / 5 s", "T1046"],
    ["651", "3", "IP bloquée par la réponse active", "—"],
], [3, 2, 8.5, 2.5])

# ---------- 8 ----------
titre("8. Difficultés rencontrées et solutions")
tableau(["Difficulté", "Solution"], [
    ["Pas d’Internet (réseau isolé)", "NAT temporaire pour installer les paquets"],
    ["Confusion agent / serveur", "`wazuh-control info | grep type`"],
    ["Règle DoS ignorée (web-accesslog est un décodeur, pas un groupe)", "Utiliser `if_sid 31108`"],
    ["L’agent ne remontait pas les logs", "Redémarrer `wazuh-agent`"],
    ["Manager planté (décodeur iptables inexistant + doublons)", "Tester avec `wazuh-analysisd -t` avant de redémarrer"],
    ["Pas d’alerte 100201 : règle écrite deux fois (« Rule ID is duplicated »)", "Supprimer le doublon dans `local_rules.xml`, revérifier avec `wazuh-analysisd -t`"],
    ["kern.log absent (journald, pas rsyslog)", "Installer `rsyslog`"],
    ["Règle scan sans résultat (la règle 4100 gagnait)", "`if_sid 4100` + niveau 3"],
], [9, 7])
image("diff_regle_dupliquee.png", None, 12)

# ---------- 10 ----------
titre("9. Conclusion")
para("Les trois détections fonctionnent : le DoS est détecté et bloqué automatiquement, l’injection SQL est "
     "reconnue par les règles natives, et le scan Nmap devient visible grâce aux logs iptables. "
     "J’ai surtout retenu la séparation agent (collecte) / serveur (règles) et l’importance de tester "
     "la configuration avant de redémarrer.")

out = os.path.join(ICI, "LABIDI_ProjetWazuh.docx")
doc.save(out)
print("OK", out)
