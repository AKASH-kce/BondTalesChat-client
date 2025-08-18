// import { HttpInterceptorFn } from '@angular/common/http';

// export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
//   const token = localStorage.getItem('authToken'); 

//   if (token) {
//     req = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`
//       }
//     });
//   }

//   // 👇 Convert headers to a readable key-value object
//   const headersObj: Record<string, string | null> = {};
//   req.headers.keys().forEach(k => {
//     headersObj[k] = req.headers.get(k);
//   });

//   console.log(
//     `HTTP ${req.method} → ${req.urlWithParams}\n` +
//     `Headers: ${JSON.stringify(headersObj, null, 2)}\n` +
//     `Body: ${JSON.stringify(req.body, null, 2)}`
//   );

//   return next(req);
// };
