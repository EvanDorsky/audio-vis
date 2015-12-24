#include <stdio.h>
#include <stdlib.h>
#include <complex.h>
#include <math.h>

typedef complex double cx;
typedef unsigned char uchar;

cx* dft(int, cx[]);
unsigned char* cdft(int, cx[]);

double cmag(cx z) {
    return sqrt(creal(z)*creal(z) + cimag(z)*cimag(z));
}

int main(int argc, char const *argv[]) {
    // cx x[6] = {1, 2, 3, 4, 5, 6};

    // cx* X = dft(6, x);

    // free(X);
    return 0;
}

cx* dft(int N, cx x[N]) {
    cx* X = (cx*)malloc(N * sizeof(cx));

    cx Xk = 0;
    for (int k = 0; k < N; k++) {
        for (int n = 0; n < N; n++) {
            Xk += x[n]*cexp(-I*2*M_PI*k*n/(N*1.0));
        }
        X[k] = Xk;
        Xk = 0;
    }

    return X;
}

unsigned char* cdft(int N, cx x[N]) {
    unsigned char* X = (unsigned char*)malloc(N * sizeof(unsigned char));

    cx Xk = 0;
    for (int k = 0; k < N; k++) {
        for (int n = 0; n < N; n++) {
            Xk += x[n]*cexp(-I*2*M_PI*k*n/(N*1.0));
        }
        X[k] = (unsigned char)(cmag(Xk)/10.0*255);
        printf("%d\n", X[k]);
        Xk = 0;
    }

    return X;
}