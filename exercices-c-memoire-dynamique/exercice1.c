/*
 * Exercice 1 - Declaration et allocation dynamique
 *
 * - Demande a l'utilisateur combien d'entiers il souhaite stocker (n)
 * - Alloue dynamiquement un tableau de n entiers avec malloc()
 * - Verifie que l'allocation a reussi
 * - Affiche un message de confirmation
 */

#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int n;
    int *tableau;

    printf("Combien d'entiers souhaitez-vous stocker ? ");
    scanf("%d", &n);

    tableau = (int *) malloc(n * sizeof(int));

    if (tableau == NULL)
    {
        printf("Erreur : l'allocation memoire a echoue.\n");
        return 1;
    }

    printf("Allocation reussie pour %d entiers.\n", n);

    free(tableau);

    return 0;
}
