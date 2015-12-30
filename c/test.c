#include <stdio.h>
#include <time.h>
#include <stdlib.h>

#include "fft.h"

int main(int argc, char const *argv[]) {
    clock_t start, end;
    
    int N = 1024;
    char* input = (char*)malloc(N * sizeof(char));
    
    for (int i = 0; i < N; i++) {
        input[i] = i%(N/8);
    }
    setN(N);
    
    char* out;
    
    printf("Start test\n");
    printf("==========\n");
    printf("%i runs of a %i-point FFT\n", N/10, N);
    start = clock();
    for (int i = 0; i < N/10; i++) {
        out = fft(input);
    }
    end = clock();
    printf("==========\n");
    printf("End test\n");
    printf("Elapsed time: %lf msec\n", (double)(end - start)/CLOCKS_PER_SEC*1000);
    
    return 0;
}