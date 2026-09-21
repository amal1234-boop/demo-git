/*
 * Exercice 4 - Liberation et securite memoire
 *
 * Ajoute a la fin du programme de l'exercice 3 :
 * - La liberation de la memoire avec free()
 * - Un message indiquant que la memoire a ete liberee
 * - Une remarque sur les bonnes pratiques (ne pas utiliser le pointeur
 *   apres free())
 */

#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int n;
    int *tableau;
    int i;

    printf("Combien d'entiers souhaitez-vous stocker ? ");
    scanf("%d", &n);

    tableau = (int *) calloc(n, sizeof(int));

    if (tableau == NULL)
    {
        printf("Erreur : l'allocation memoire a echoue.\n");
        return 1;
    }

    printf("Allocation (calloc) reussie pour %d entiers.\n", n);

    printf("\nContenu du tableau juste apres l'allocation (avant saisie) :\n");
    for (i = 0; i < n; i++)
    {
        printf("tableau[%d] = %d\n", i, tableau[i]);
    }

    for (i = 0; i < n; i++)
    {
        printf("Valeur pour l'indice %d : ", i);
        scanf("%d", &tableau[i]);
    }

    printf("\nValeurs saisies :\n");
    for (i = 0; i < n; i++)
    {
        printf("tableau[%d] = %d\n", i, tableau[i]);
    }

    /* Liberation de la memoire allouee dynamiquement */
    free(tableau);
    tableau = NULL; /* bonne pratique : eviter tout pointeur "dangling" */

    printf("\nMemoire liberee avec succes.\n");
    printf("Remarque : apres un free(), le pointeur devient invalide.\n");
    printf("Il ne faut plus jamais le lire, l'ecrire ni le liberer une\n");
    printf("seconde fois (double free). On le remet a NULL par securite,\n");
    printf("ce qui permet de detecter facilement une utilisation apres\n");
    printf("liberation (use-after-free).\n");

    return 0;
}
