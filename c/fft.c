#include "fft.h"

typedef complex double cx;

double _Complex __muldc3(double, double, double, double);
double cmag(cx z);
void cprint(cx z);

void gen_blackman(double, double*);
void gen_hann(double, double*);
void cwindow(char*);

cx Wa(int, int);
cx* A(int, cx*);

// http://graphics.stanford.edu/~seander/bithacks.html#BitReverseObvious
unsigned int revbits(unsigned int v, unsigned int m) {
    unsigned int r = 0;
    
    unsigned int b = m;
    for (;v; v >>= 1){
        b--;
        r |= (v & 1) << b;
    }
    
    return r;
}

int N;
int m;
double* g_window;
char* xmag;
void setN(int _N) {
    N = _N;
    m = (int)log2(N);
    xmag = (char*)malloc(N * sizeof(char));

    g_window = (double*)malloc(N * sizeof(double));
    gen_blackman(0.16, g_window);
}

char* fft(char* x) {
    cwindow(x);
    
    cx* xcx = (cx*)malloc(N * sizeof(cx));
    for (int i = 0; i < N; i++)
        xcx[i] = (cx)x[i];
    
    cx* Xr = A(m, xcx);
    
    for (int i = 0; i < N; i++)
        xmag[i] = (char)(cmag(Xr[i])/N);

    unsigned int j = 0;
    char tmp;
    for (unsigned int i = 0; i < N; i++) {
        j = revbits(i, m);
        if (i < j) {
            tmp = xmag[i];
            xmag[i] = xmag[j];
            xmag[j] = tmp;
        }
    }
    
    free(Xr);
    return xmag;
}


char* dft(char* x) {
    char* X = (char*)malloc(N * sizeof(char));

    cwindow(x);

    cx Xk = 0;
    for (int k = 0; k < N; k++) {
        for (int n = 0; n < N; n++) {
            Xk += x[n]*cexp(-I*2*M_PI*k*n/(N*1.0));
        }
        X[k] = (char)(cmag(Xk)/N);
        Xk = 0;
    }

    return X;
}

cx Wa(int l, int j) {
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
cx* A(int l, cx* x) {
    cx* Al = (cx*)malloc(N * sizeof(cx));
    
    if (l > 1)
        Al1 = A(l-1, x);
    else
        Al1 = x;
    
    kmlbit = 1 << (m-l);
    for (int jk = 0; jk < N; jk++) {
        W = Wa(l, jk);
        kmlcheck = ((jk&kmlbit)>>(m-l));
        Al[jk] = Al1[jk]*(kmlcheck? W:1);
        kmlcheck = (((jk^kmlbit)&kmlbit)>>(m-l));
        Al[jk] += Al1[jk^kmlbit]*(kmlcheck? W:1);
    }

    free(Al1);
    return Al;
}

void gen_blackman(double a, double* blackman) {
    int Nw = N+1;
    
    double a0 = (1-a)/2.0;
    double a1 = 0.5;
    double a2 = a/2;
    
    for (int n = 0; n < Nw; n++) {
        blackman[n] = a0 - a1*cos(2*M_PI*n/(Nw - 1.0)) + a2*cos(4*M_PI*n/(Nw - 1.0));
    }
}

void gen_hann(double a, double* hann) {
    int Nw = N+1;
    
    for (int n = 0; n < Nw; n++) {
        hann[n] = 0.5*(1 - cos(2*M_PI*n/(Nw - 1.0)));
    }
}

// in-place windowing
void cwindow(char* x) {
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