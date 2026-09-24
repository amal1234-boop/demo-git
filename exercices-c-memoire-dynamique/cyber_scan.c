/*
 * NeoSecure - cyber_scan.c
 *
 * Mini-outil d'analyse textuelle : detecte des indices de compromission
 * dans un message (caracteres speciaux, chiffres, majuscules, mots cles)
 * et produit un rapport avec un score de suspicion.
 *
 * Contraintes respectees :
 * - tableau de char, pas de string.h
 * - parcours caractere par caractere
 * - detection de mots cles par comparaison caractere par caractere
 * - manipulation via pointeur *(ptr + i)
 * - fgets() a la place de gets()
 */

#include <stdio.h>

#define TAILLE_MAX 205

int main(void)
{
    char message[TAILLE_MAX];
    char *ptr;
    int i;
    int longueur;

    int nb_speciaux = 0;
    int nb_chiffres = 0;
    int nb_espaces = 0;
    int nb_majuscules = 0;
    int nb_hack = 0;
    int nb_root = 0;
    int nb_admin = 0;
    int nb_motscles;
    int score;

    printf("=== NeoSecure - Analyseur de messages suspects ===\n\n");
    printf("Entrez un message a analyser (100 a 200 caracteres) :\n");

    fgets(message, TAILLE_MAX, stdin);

    /* Calcul de la longueur reelle en cherchant le caractere nul */
    longueur = 0;
    while (message[longueur] != '\0')
    {
        longueur++;
    }

    /* Suppression du retour a la ligne final laisse par fgets() */
    if (longueur > 0 && message[longueur - 1] == '\n')
    {
        message[longueur - 1] = '\0';
        longueur--;
    }

    /* ===== Parcours caractere par caractere via un pointeur ===== */
    ptr = message;

    for (i = 0; i < longueur; i++)
    {
        char c = *(ptr + i);

        if (c == '@' || c == '#' || c == '%' || c == '&' || c == '*' || c == '!' || c == '?')
        {
            nb_speciaux++;
        }
        else if (c >= '0' && c <= '9')
        {
            nb_chiffres++;
        }
        else if (c == ' ')
        {
            nb_espaces++;
        }
        else if (c >= 'A' && c <= 'Z')
        {
            nb_majuscules++;
        }

        /* Detection du mot cle "hack" (insensible a la casse) */
        if ((i + 3 < longueur) &&
            (c == 'h' || c == 'H') &&
            (*(ptr + i + 1) == 'a' || *(ptr + i + 1) == 'A') &&
            (*(ptr + i + 2) == 'c' || *(ptr + i + 2) == 'C') &&
            (*(ptr + i + 3) == 'k' || *(ptr + i + 3) == 'K'))
        {
            nb_hack++;
        }

        /* Detection du mot cle "root" (insensible a la casse) */
        if ((i + 3 < longueur) &&
            (c == 'r' || c == 'R') &&
            (*(ptr + i + 1) == 'o' || *(ptr + i + 1) == 'O') &&
            (*(ptr + i + 2) == 'o' || *(ptr + i + 2) == 'O') &&
            (*(ptr + i + 3) == 't' || *(ptr + i + 3) == 'T'))
        {
            nb_root++;
        }

        /* Detection du mot cle "admin" (insensible a la casse) */
        if ((i + 4 < longueur) &&
            (c == 'a' || c == 'A') &&
            (*(ptr + i + 1) == 'd' || *(ptr + i + 1) == 'D') &&
            (*(ptr + i + 2) == 'm' || *(ptr + i + 2) == 'M') &&
            (*(ptr + i + 3) == 'i' || *(ptr + i + 3) == 'I') &&
            (*(ptr + i + 4) == 'n' || *(ptr + i + 4) == 'N'))
        {
            nb_admin++;
        }
    }

    nb_motscles = nb_hack + nb_root + nb_admin;

    /* ===== Calcul du score de suspicion ===== */
    score = (nb_speciaux * 2) + (nb_chiffres * 1) + (nb_majuscules * 1) + (nb_motscles * 15);

    /* ===== Rapport final ===== */
    printf("\n========== RAPPORT D'ANALYSE NEOSECURE ==========\n");
    printf("Longueur du message analyse   : %d caracteres\n", longueur);
    printf("Caracteres speciaux (@#%%&*!?) : %d\n", nb_speciaux);
    printf("Chiffres                      : %d\n", nb_chiffres);
    printf("Espaces                       : %d\n", nb_espaces);
    printf("Lettres majuscules            : %d\n", nb_majuscules);
    printf("--------------------------------------------------\n");
    printf("Occurrences de \"hack\"         : %d\n", nb_hack);
    printf("Occurrences de \"root\"         : %d\n", nb_root);
    printf("Occurrences de \"admin\"        : %d\n", nb_admin);
    printf("Total mots cles detectes      : %d\n", nb_motscles);
    printf("--------------------------------------------------\n");
    printf("SCORE DE SUSPICION            : %d\n", score);

    if (score >= 50)
    {
        printf("NIVEAU DE RISQUE              : ELEVE (message tres suspect)\n");
    }
    else if (score >= 20)
    {
        printf("NIVEAU DE RISQUE              : MOYEN (a surveiller)\n");
    }
    else
    {
        printf("NIVEAU DE RISQUE              : FAIBLE (rien de particulier)\n");
    }
    printf("===================================================\n");

    return 0;
}
