/*
 * Exercice 5 - Rechercher le maximum
 *
 * Saisir 6 entiers et les ranger a partir de l'adresse adr_deb.
 * Rechercher le maximum, l'afficher ainsi que son adresse.
 */

#include <stdio.h>
#include <stdlib.h>

#define NB_VALEURS 6

int main(void)
{
    int *adr_deb;
    int *p;
    int *adr_max;
    int i;

    adr_deb = (int *) malloc(NB_VALEURS * sizeof(int));

    if (adr_deb == NULL)
    {
        printf("Erreur : l'allocation memoire a echoue.\n");
        return 1;
    }

    /* Saisie des 6 entiers a partir de l'adresse adr_deb */
    for (p = adr_deb, i = 0; i < NB_VALEURS; p++, i++)
    {
        printf("Entrez la valeur %d : ", i + 1);
        scanf("%d", p);
    }

    /* Recherche du maximum en parcourant le tableau via des pointeurs */
    adr_max = adr_deb;
    for (p = adr_deb + 1; p < adr_deb + NB_VALEURS; p++)
    {
        if (*p > *adr_max)
        {
            adr_max = p;
        }
    }

    printf("\nValeur maximale : %d\n", *adr_max);
    printf("Adresse du maximum : %p\n", (void *) adr_max);

    free(adr_deb);

    return 0;
}
