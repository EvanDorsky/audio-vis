#include <stdio.h>
#include <stdlib.h>
#include <complex.h>
#include <math.h>

// http://opensource.apple.com/source/clang/clang-137/src/projects/compiler-rt/lib/muldc3.c
double _Complex
__muldc3(double __a, double __b, double __c, double __d)
{
    double __ac = __a * __c;
    double __bd = __b * __d;
    double __ad = __a * __d;
    double __bc = __b * __c;
    double _Complex z;
    __real__ z = __ac - __bd;
    __imag__ z = __ad + __bc;
    if (isnan(__real__ z) && isnan(__imag__ z))
    {
        int __recalc = 0;
        if (isinf(__a) || isinf(__b))
        {
            __a = copysign(isinf(__a) ? 1 : 0, __a);
            __b = copysign(isinf(__b) ? 1 : 0, __b);
            if (isnan(__c))
                __c = copysign(0, __c);
            if (isnan(__d))
                __d = copysign(0, __d);
            __recalc = 1;
        }
        if (isinf(__c) || isinf(__d))
        {
            __c = copysign(isinf(__c) ? 1 : 0, __c);
            __d = copysign(isinf(__d) ? 1 : 0, __d);
            if (isnan(__a))
                __a = copysign(0, __a);
            if (isnan(__b))
                __b = copysign(0, __b);
            __recalc = 1;
        }
        if (!__recalc && (isinf(__ac) || isinf(__bd) ||
                          isinf(__ad) || isinf(__bc)))
        {
            if (isnan(__a))
                __a = copysign(0, __a);
            if (isnan(__b))
                __b = copysign(0, __b);
            if (isnan(__c))
                __c = copysign(0, __c);
            if (isnan(__d))
                __d = copysign(0, __d);
            __recalc = 1;
        }
        if (__recalc)
        {
            __real__ z = INFINITY * (__a * __c - __b * __d);
            __imag__ z = INFINITY * (__a * __d + __b * __c);
        }
    }
    return z;
}


typedef complex double cx;

cx* dft(int, cx[]);
char* cdft(int, char[]);

double cmag(cx z) {
    return sqrt(creal(z)*creal(z) + cimag(z)*cimag(z));
}

int main(int argc, char const *argv[]) {
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

char* cdft(int N, char x[N/2]) {
    char* X = (char*)malloc(N/2 * sizeof(char));

    cx Xk = 0;
    for (int k = 0; k < N/2; k++) { // only real inputs
        for (int n = 0; n < N; n++) {
            Xk += x[n]*cexp(-I*2*M_PI*k*n/(N*1.0));
        }
        X[k] = (char)(cmag(Xk)/N);
        // printf("%f\n", cmag(Xk)/N);
        Xk = 0;
    }

    return X;
}