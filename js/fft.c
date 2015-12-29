#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <complex.h>
#include <string.h>
#include <math.h>
#include <limits.h>

typedef complex double cx;

double _Complex __muldc3(double, double, double, double);
double cmag(cx z);
void cprint(cx z);

void gen_blackman(double, int, double*);
void gen_hann(double, int, double*);
void cwindow(int, char*);

char* cdft(int, char*);
cx* fft(int, cx*, int, int);
cx* A(int, int, int, cx*);

// http://graphics.stanford.edu/~seander/bithacks.html#BitReverseObvious
unsigned int revbits(unsigned int v, unsigned int m) {
    unsigned int r = v;
    unsigned int mask = 0xffffffff >> (sizeof(unsigned int)* CHAR_BIT - m);

    for (v >>= 1; v; v >>= 1){   
        r <<= 1;
        r |= v & 1;
    }

    return (r & mask);
}

double* g_window;
int main(int argc, char const *argv[]) {
    return 0;
}

_Bool window_done = 0;
char* xmag;// windows data, sets basic constants
char* cdft(int N, char* x) {
    if (!window_done) {
        xmag = (char*)malloc(N * sizeof(char));
        g_window = (double*)malloc(N * sizeof(double));
        gen_blackman(0.16, N, g_window);
        window_done = 1;
    }
    cwindow(N, x);
    
    cx* xcx = (cx*)malloc(N * sizeof(cx));
    for (int i = 0; i < N; i++) {
        xcx[i] = (cx)x[i];
    }
    // put x into X
    
    int m = log2(N);
    cx* Xr = A(N, m, m, xcx);
    
    for (int i = 0; i < N; i++) {
        xmag[i] = (char)(cmag(Xr[i])/N);
    }
    // get X mag from X

    // bit reverse xmag
    unsigned int j = 0;
    for (unsigned int i = 0; i < N; i++) {
        j = revbits(i, m);
        if (i > j) {
            char tmp = xmag[i];
            xmag[i] = xmag[j];
            xmag[j] = tmp;
        }
    }
    
    free(Xr);
    return xmag;
}

// appears to be good
cx Wa(int N, int m, int l, int j) {
    cx w = cexp(2*M_PI/N*I);
    cx aW = 1;
    
    int btest;
    int b;
    for (int v = 0; v < l; v++) {
        btest = 1 << (m-1-v);
        b = 1 << v;
        aW *= cpow(w, ((j&btest)>>(l-1-v))*b);
    }
    return aW;
}

cx* Al1;
cx Wjk;
cx W;
int kmlbit;
int kmlcheck;
cx* A(int N, int m, int l, cx* x) {
    cx* Al = (cx*)malloc(N * sizeof(cx));
    
    if (l > 1)
        Al1 = A(N, m, l-1, x);
    else
        Al1 = x;
    
    kmlbit = 1 << (m-l);
    for (int jk = 0; jk < N; jk++) {
        W = Wa(N, m, l, jk);
        kmlcheck = ((jk&kmlbit)>>(m-l));
        Al[jk] = Al1[jk]*(kmlcheck? W:1);
        kmlcheck = (((jk^kmlbit)&kmlbit)>>(m-l));
        Al[jk] += Al1[jk^kmlbit]*(kmlcheck? W:1);
    }

    free(Al1);
    return Al;
}

void gen_blackman(double a, int N, double* blackman) {
    N++;
    
    double a0 = (1-a)/2.0;
    double a1 = 0.5;
    double a2 = a/2;
    
    for (int n = 0; n < N; n++) {
        blackman[n] = a0 - a1*cos(2*M_PI*n/(N - 1.0)) + a2*cos(4*M_PI*n/(N - 1.0));
    }
}

void gen_hann(double a, int N, double* hann) {
    N++;
    
    for (int n = 0; n < N; n++) {
        hann[n] = 0.5*(1 - cos(2*M_PI*n/(N - 1.0)));
    }
}

// in-place windowing
void cwindow(int N, char* x) {
    for (int n = 0; n < N; n++) {
        x[n] = (char)(x[n]*g_window[n]);
    }
}

double cmag(cx z) {
    return sqrt(creal(z)*creal(z) + cimag(z)*cimag(z));
}

void cprint(cx z) {
    printf("%f + %fi\n", creal(z), cimag(z));
}

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